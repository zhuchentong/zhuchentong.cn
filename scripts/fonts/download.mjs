// scripts/fonts/download.mjs
import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sourceDir = path.resolve(__dirname, 'source')

if (!fs.existsSync(sourceDir)) {
  fs.mkdirSync(sourceDir, { recursive: true })
}

const fonts = [
  {
    name: 'MaShanZheng-Regular.ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/mashanzheng/MaShanZheng-Regular.ttf',
    required: true,
  },
  {
    name: 'NotoSerifSC[wght].ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf',
    required: false,
  },
  {
    name: 'NotoSansSC[wght].ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf',
    required: false,
  },
]

for (const { name, url, required } of fonts) {
  const dest = path.join(sourceDir, name)
  if (fs.existsSync(dest)) {
    console.log(`Already exists: ${name}`)
    continue
  }

  console.log(`Downloading: ${name}...`)
  try {
    const res = await fetch(url)
    if (!res.ok)
      throw new Error(`HTTP ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    fs.writeFileSync(dest, buf)
    console.log(`  ✓ ${name} (${(buf.length / 1024 / 1024).toFixed(1)} MB)`)
  }
  catch (err) {
    if (required) {
      console.error(`  ✗ Failed to download required font: ${name}`, err)
      process.exit(1)
    }
    console.log(`  ✗ Skipped optional font: ${name} (${err.message})`)
  }
}

console.log('\nDone. Files in scripts/fonts/source/:')
for (const f of fs.readdirSync(sourceDir)) {
  const stat = fs.statSync(path.join(sourceDir, f))
  console.log(`  ${f} (${(stat.size / 1024 / 1024).toFixed(1)} MB)`)
}
