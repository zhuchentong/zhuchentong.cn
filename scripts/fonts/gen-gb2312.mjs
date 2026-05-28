// scripts/fonts/gen-gb2312.mjs
import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const destFile = path.resolve(__dirname, 'gb2312-chars.txt')

const decoder = new TextDecoder('gbk')
let chars = ''

for (let i = 0x20; i <= 0x7E; i++) {
  chars += String.fromCodePoint(i)
}

for (let qu = 0xB0; qu <= 0xF7; qu++) {
  for (let wei = 0xA1; wei <= 0xFE; wei++) {
    const buf = Buffer.from([qu, wei])
    const decoded = decoder.decode(buf)
    if (/[\u4E00-\u9FFF]/.test(decoded)) {
      chars += decoded
    }
  }
}

chars += '，。、；：？！\u201C\u201D\u2018\u2019（）【】《》—…·'

fs.writeFileSync(destFile, chars, 'utf-8')

let cjkCount = 0
for (const ch of chars) {
  if (/[\u4E00-\u9FFF]/.test(ch))
    cjkCount++
}
console.log(`Generated ${chars.length} total characters (${cjkCount} CJK, ${chars.length - cjkCount} non-CJK)`)
console.log(`Saved to: ${destFile}`)
