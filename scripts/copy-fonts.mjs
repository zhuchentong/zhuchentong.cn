// scripts/copy-fonts.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.resolve(__dirname, '../src/apps/copybook/assets/fonts')
const destDir = path.resolve(__dirname, '../dist/fonts')

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true })
}

let copied = 0
for (const file of fs.readdirSync(srcDir)) {
  if (!file.endsWith('.ttf'))
    continue
  const src = path.join(srcDir, file)
  const dest = path.join(destDir, file)
  fs.copyFileSync(src, dest)
  const size = (fs.statSync(dest).size / 1024 / 1024).toFixed(1)
  console.log(`  Copied: ${file} (${size} MB)`)
  copied++
}
console.log(`\nDone. ${copied} font files copied to dist/fonts/`)
