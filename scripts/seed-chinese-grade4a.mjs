// scripts/seed-chinese-grade4a.mjs
// 部编版四年级上册 语文：一类字（写字表）+ 二类字（识字表）批量导入
// 数据源：data/语文_四年级上_一类字.txt + data/语文_四年级上_二类字.txt
// 用法：node scripts/seed-chinese-grade4a.mjs
// 幂等：教材按 publisher+name 复用；单元/篇目/字/关联均 ON CONFLICT 去重，可重复运行
import { readFileSync } from 'node:fs'
import process from 'node:process'
import postgres from 'postgres'

// 手动加载 .env（取 DB 连接信息）
for (const line of readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]])
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const sql = postgres(`postgres://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_DB}`)

const DATA_DIR = new URL('../data/', import.meta.url).pathname

// 教材元信息（对齐英语应用命名）
const textbook = {
  name: '四年级上册',
  publisher: '人教版',
  grade: '四年级',
  semester: '上',
}

// 中文数字 → 数字（单元号，支持 一..八 / 十 / 十一..）
const CN_NUM = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 }
function unitNumberOf(str) {
  const m = str.match(/第([一二三四五六七八九十]+)单元/)
  if (!m)
    return null
  const s = m[1]
  if (s === '十')
    return 10
  if (s.startsWith('十'))
    return 10 + (CN_NUM[s[1]] ?? 0)
  return CN_NUM[s] ?? null
}

// 解析 "盐(yán) 薄(bó)" 串 → [{ char, pinyin }]
function parseCharsWithPinyin(str) {
  const out = []
  const re = /([\u4E00-\u9FFF])\(([^)]+)\)/g
  for (const mm of str.matchAll(re))
    out.push({ char: mm[1], pinyin: mm[2].trim() })
  return out
}

// 解析二类字文件（master）：建单元 + 课文 + 语文园地，含拼音
function parseErlei(raw) {
  const units = []
  let cur = null
  for (const line of raw.split('\n')) {
    const t = line.trim()
    if (!t)
      continue
    const un = unitNumberOf(t)
    if (un != null) {
      cur = { unitNumber: un, lessons: [] }
      units.push(cur)
      continue
    }
    if (!cur)
      continue
    // 语文园地：【语文园地】：字(拼音) ...
    const g = t.match(/^【语文园地】\s*[：:](.+)$/)
    if (g) {
      cur.lessons.push({ type: 'garden', lessonNumber: null, title: '语文园地', chars: parseCharsWithPinyin(g[1].trim()) })
      continue
    }
    // 课文：课号 课题：字(拼音) ...
    const l = t.match(/^(\d+)\s+(\S.*)$/)
    if (l) {
      const ci = l[2].search(/[：:]/)
      if (ci !== -1) {
        cur.lessons.push({ type: 'text', lessonNumber: Number(l[1]), title: l[2].slice(0, ci).trim(), chars: parseCharsWithPinyin(l[2].slice(ci + 1)) })
        continue
      }
    }
    console.warn('  ⚠ 二类字跳过未识别行:', t)
  }
  return units
}

// 解析一类字文件：返回 Map<lessonNumber, string[]>（顿号分隔的字，无拼音）
function parseYilei(raw) {
  const map = new Map()
  let pending = null
  for (const line of raw.split('\n')) {
    const t = line.trim()
    if (!t || unitNumberOf(t) != null) {
      pending = null
      continue
    }
    // 课文标题行 "1 观潮"（无顿号）
    const l = t.match(/^(\d+)\s+(\S.*)$/)
    if (l && !t.includes('、')) {
      pending = Number(l[1])
      map.set(pending, [])
      continue
    }
    // 字行（顿号分隔，仅保留单字）
    if (pending != null && t.includes('、')) {
      map.set(pending, t.split('、').map(s => s.trim()).filter(s => /^[\u4E00-\u9FFF]$/.test(s)))
      pending = null
    }
  }
  return map
}

// 解析词语文件：返回 Map<lessonNumber, string[]>（顿号分隔的词，无拼音，多字）
function parseWords(raw) {
  const map = new Map()
  let pending = null
  for (const line of raw.split('\n')) {
    const t = line.trim()
    if (!t || unitNumberOf(t) != null) {
      pending = null
      continue
    }
    const l = t.match(/^(\d+)\s+(\S.*)$/)
    if (l && !t.includes('、')) {
      pending = Number(l[1])
      map.set(pending, [])
      continue
    }
    // 词行（顿号分隔，保留多字词）
    if (pending != null && t.includes('、')) {
      map.set(pending, t.split('、').map(s => s.trim()).filter(s => /^[\u4E00-\u9FFF]+$/.test(s)))
      pending = null
    }
  }
  return map
}

// ── 主流程 ────────────────────────────────────────────────────────
async function main() {
  console.log('读取数据文件…')
  const erleiUnits = parseErlei(readFileSync(`${DATA_DIR}语文_四年级上_二类字.txt`, 'utf8'))
  const yileiMap = parseYilei(readFileSync(`${DATA_DIR}语文_四年级上_一类字.txt`, 'utf8'))
  const wordsMap = parseWords(readFileSync(`${DATA_DIR}语文_四年级上_词语.txt`, 'utf8'))
  const nLessonsTotal = erleiUnits.reduce((n, u) => n + u.lessons.length, 0)
  console.log(`  二类字：${erleiUnits.length} 单元 / ${nLessonsTotal} 篇目`)
  console.log(`  一类字：${yileiMap.size} 课文（写字表）`)
  console.log(`  词语：${wordsMap.size} 课文\n`)

  // 1. 教材：find-or-create（按 publisher + name）
  let [tb] = await sql`SELECT id FROM chinese_textbook WHERE name = ${textbook.name} AND publisher = ${textbook.publisher} LIMIT 1`
  if (!tb)
    [tb] = await sql`INSERT INTO chinese_textbook ${sql(textbook)} RETURNING id`
  console.log(`教材：id=${tb.id} ${textbook.publisher}·${textbook.name}\n`)

  const charPinyin = new Map() // 字 → 主音（取二类字首次出现）
  let nLessons = 0
  let nErlei = 0
  let nYilei = 0
  let nWords = 0

  // 2. 单元 + 篇目 + 二类字
  for (const u of erleiUnits) {
    const [unitRow] = await sql`
      INSERT INTO chinese_unit (textbook_id, unit_number, position)
      VALUES (${tb.id}, ${u.unitNumber}, ${u.unitNumber})
      ON CONFLICT (textbook_id, unit_number) DO UPDATE SET position = EXCLUDED.position
      RETURNING id`

    let pos = 0
    for (const ls of u.lessons) {
      pos++
      const [lessonRow] = await sql`
        INSERT INTO chinese_lesson (unit_id, lesson_number, title, type, position)
        VALUES (${unitRow.id}, ${ls.lessonNumber}, ${ls.title}, ${ls.type}, ${pos})
        ON CONFLICT (unit_id, position) DO UPDATE SET title = EXCLUDED.title, lesson_number = EXCLUDED.lesson_number, type = EXCLUDED.type
        RETURNING id`
      nLessons++

      let cpos = 0
      for (const { char, pinyin } of ls.chars) {
        cpos++
        nErlei++
        if (!charPinyin.has(char))
          charPinyin.set(char, pinyin)
        const [charRow] = await sql`
          INSERT INTO chinese_character (character, pinyin)
          VALUES (${char}, ${pinyin})
          ON CONFLICT (character) DO UPDATE SET pinyin = COALESCE(chinese_character.pinyin, EXCLUDED.pinyin)
          RETURNING id`
        await sql`
          INSERT INTO chinese_lesson_character (lesson_id, character_id, category, pinyin, position)
          VALUES (${lessonRow.id}, ${charRow.id}, 'two', ${pinyin}, ${cpos})
          ON CONFLICT DO NOTHING`
      }
    }
  }
  console.log(`二类字：${nLessons} 篇目已建，${nErlei} 条识字关联`)

  // 3. 一类字：按课号匹配 lesson，挂 category='one'（拼音留 NULL）
  for (const [lessonNumber, chars] of yileiMap) {
    const [lessonRow] = await sql`
      SELECT cl.id FROM chinese_lesson cl
      JOIN chinese_unit cu ON cu.id = cl.unit_id
      WHERE cu.textbook_id = ${tb.id} AND cl.lesson_number = ${lessonNumber}
      LIMIT 1`
    if (!lessonRow) {
      console.warn(`  ⚠ 一类字未找到课号 ${lessonNumber}，跳过`)
      continue
    }
    let cpos = 0
    for (const char of chars) {
      cpos++
      nYilei++
      const py = charPinyin.get(char) ?? null
      const [charRow] = await sql`
        INSERT INTO chinese_character (character, pinyin)
        VALUES (${char}, ${py})
        ON CONFLICT (character) DO UPDATE SET pinyin = COALESCE(chinese_character.pinyin, EXCLUDED.pinyin)
        RETURNING id`
      await sql`
        INSERT INTO chinese_lesson_character (lesson_id, character_id, category, position)
        VALUES (${lessonRow.id}, ${charRow.id}, 'one', ${cpos})
        ON CONFLICT DO NOTHING`
    }
  }
  console.log(`一类字：${nYilei} 条写字关联\n`)

  // 4. 词语：按课号匹配 lesson，挂 chinese_lesson_word（拼音留 NULL）
  for (const [lessonNumber, words] of wordsMap) {
    const [lessonRow] = await sql`
      SELECT cl.id FROM chinese_lesson cl
      JOIN chinese_unit cu ON cu.id = cl.unit_id
      WHERE cu.textbook_id = ${tb.id} AND cl.lesson_number = ${lessonNumber}
      LIMIT 1`
    if (!lessonRow) {
      console.warn(`  ⚠ 词语未找到课号 ${lessonNumber}，跳过`)
      continue
    }
    let wpos = 0
    for (const word of words) {
      wpos++
      nWords++
      const [wordRow] = await sql`
        INSERT INTO chinese_word (word)
        VALUES (${word})
        ON CONFLICT (word) DO UPDATE SET word = EXCLUDED.word
        RETURNING id`
      await sql`
        INSERT INTO chinese_lesson_word (lesson_id, word_id, position)
        VALUES (${lessonRow.id}, ${wordRow.id}, ${wpos})
        ON CONFLICT DO NOTHING`
    }
  }
  console.log(`词语：${nWords} 条词语关联\n`)

  console.log('完成。')
  await sql.end()
}

main().catch((err) => {
  console.error('\n✗ 执行失败:', err)
  process.exit(1)
})
