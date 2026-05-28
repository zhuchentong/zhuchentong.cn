import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import Fontmin from 'fontmin'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sourceDir = path.resolve(__dirname, 'source')
const destDir = path.resolve(__dirname, '../../src/assets/fonts')
const charFile = path.resolve(__dirname, 'gb2312-chars.txt')

const text = fs.readFileSync(charFile, 'utf-8')
let cjkCount = 0
for (const ch of text) {
  if (/[\u4E00-\u9FFF]/.test(ch))
    cjkCount++
}
console.log(`Loading ${text.length} characters (${cjkCount} CJK) for subsetting`)

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true })
}

const fonts = [
  { file: 'MaShanZheng-Regular.ttf', output: 'MaShanZheng-Regular', required: true },
  { file: 'NotoSerifSC[wght].ttf', output: 'NotoSerifSC-Regular', required: false },
  { file: 'NotoSansSC[wght].ttf', output: 'NotoSansSC-Regular', required: false },
]

let processed = 0
let failed = 0

for (const { file, required } of fonts) {
  const src = path.join(sourceDir, file)
  if (!fs.existsSync(src)) {
    if (required) {
      console.error(`Missing required font: ${src}`)
      process.exit(1)
    }
    console.log(`Skipping optional font: ${file}`)
    continue
  }

  console.log(`\nProcessing: ${file}`)

  await new Promise((resolve) => {
    new Fontmin()
      .src(src)
      .use(Fontmin.glyph({
        text,
        hinting: false,
      }))
      .use(Fontmin.ttf2woff2())
      .dest(destDir)
      .run((err, files) => {
        if (err) {
          console.error(`Error processing ${file}:`, err)
          if (required)
            process.exit(1)
          failed++
          resolve()
          return
        }
        const woff2 = files.find(f => f.path.endsWith('.woff2'))
        if (woff2) {
          const size = (woff2.contents.length / 1024).toFixed(0)
          console.log(`  ✓ ${path.basename(woff2.path)} (${size} KB)`)
          processed++
        }
        resolve()
      })
  })
}

console.log(`\nDone. ${processed} fonts subsetted, ${failed} failed.`)
console.log(`Output: ${destDir}`)
for (const f of fs.readdirSync(destDir).filter(f => f.endsWith('.woff2'))) {
  const stat = fs.statSync(path.join(destDir, f))
  console.log(`  ${f} (${(stat.size / 1024).toFixed(0)} KB)`)
}
