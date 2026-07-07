// scripts/seed-chinese-text-grade4a.mjs
// 部编版四年级上册 语文：课文/古诗/语文园地日积月累 批量导入
// 数据源：data/语文_四年级上_课文.json（结构化）
// 用法：node scripts/seed-chinese-text-grade4a.mjs
//
// JSON 结构：
//   [{ unitNumber, lessonNumber|null, isGarden, items: [{ category, title?, dynasty?, author?, content }] }]
// category: 'passage' 课文段 | 'poem' 古诗 | 'idiom' 成语/谚语/名言
//
// 切分策略（passage 类按句切，其他整条保留）：
//   - passage：按 [。！？；?!;] 切句，每句一条，符合打字练习粒度
//   - poem：整首一条（含 title/dynasty/author/content，content 中 \n 用于 TextTyper 视觉分行）
//   - idiom：每条成语/谚语/名言一条
//
// 幂等：每个 lesson 写入前先 DELETE 旧条目，再按 position 重新插入，可重复运行
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
const TEXTBOOK_NAME = '四年级上册'
const TEXTBOOK_PUBLISHER = '人教版'

/** 按句切分，保留句末标点（passage 类专用） */
function splitSentences(text) {
  const out = []
  let cur = ''
  for (const ch of text) {
    cur += ch
    if (/[。！？；?!;]/.test(ch)) {
      const s = cur.trim()
      if (s)
        out.push(s)
      cur = ''
    }
  }
  const rest = cur.trim()
  if (rest)
    out.push(rest)
  return out
}

/** 把一个 group 的 items 展开：passage 按句切，其他整条保留 */
function expandItems(items) {
  const out = []
  for (const it of items) {
    if (it.category === 'passage') {
      for (const s of splitSentences(it.content)) {
        out.push({ ...it, content: s })
      }
    }
    else {
      out.push(it)
    }
  }
  return out
}

// ── 主流程 ────────────────────────────────────────────────────────
async function main() {
  console.log('读取 JSON 数据文件…')
  const rawGroups = JSON.parse(readFileSync(`${DATA_DIR}语文_四年级上_课文.json`, 'utf8'))
  // 对 passage 类按句切分
  const groups = rawGroups.map(g => ({ ...g, items: expandItems(g.items) }))
  console.log(`  ${groups.length} 个内容组\n`)

  // 1. 教材
  const [tb] = await sql`SELECT id FROM chinese_textbook WHERE name = ${TEXTBOOK_NAME} AND publisher = ${TEXTBOOK_PUBLISHER} LIMIT 1`
  if (!tb) {
    console.error('✗ 未找到教材，请先运行 seed-chinese-grade4a.mjs')
    process.exit(1)
  }
  console.log(`教材：id=${tb.id} ${TEXTBOOK_PUBLISHER}·${TEXTBOOK_NAME}\n`)

  // 预拉单元
  const unitRows = await sql`SELECT id, unit_number FROM chinese_unit WHERE textbook_id = ${tb.id}`
  const unitByNumber = new Map(unitRows.map(u => [u.unit_number, u]))

  let nLessonsTouched = 0
  let nItemsWritten = 0
  let nGardenCreated = 0

  for (const g of groups) {
    if (!g.items?.length) {
      console.warn(`  ⚠ 组（unit=${g.unitNumber} ${g.isGarden ? 'garden' : `L${g.lessonNumber}`}）无条目，跳过`)
      continue
    }

    // 2. 定位 lessonId
    let lessonId = null
    if (g.isGarden) {
      const [existing] = await sql`
        SELECT cl.id FROM chinese_lesson cl
        JOIN chinese_unit cu ON cu.id = cl.unit_id
        WHERE cu.textbook_id = ${tb.id} AND cu.unit_number = ${g.unitNumber} AND cl.type = 'garden'
        LIMIT 1`
      if (existing) {
        lessonId = existing.id
      }
      else {
        // 补建 garden 课
        const u = unitByNumber.get(g.unitNumber)
        if (!u) {
          console.warn(`  ⚠ 单元 ${g.unitNumber} 不存在，跳过园地`)
          continue
        }
        const [max] = await sql`SELECT COALESCE(MAX(position), 0) AS m FROM chinese_lesson WHERE unit_id = ${u.id}`
        const [row] = await sql`
          INSERT INTO chinese_lesson (unit_id, lesson_number, title, type, position)
          VALUES (${u.id}, NULL, '语文园地', 'garden', ${max.m + 1})
          RETURNING id`
        lessonId = row.id
        nGardenCreated++
        console.log(`  + 补建 garden 课：单元${g.unitNumber} (lessonId=${lessonId})`)
      }
    }
    else {
      const [row] = await sql`
        SELECT cl.id FROM chinese_lesson cl
        JOIN chinese_unit cu ON cu.id = cl.unit_id
        WHERE cu.textbook_id = ${tb.id} AND cl.lesson_number = ${g.lessonNumber}
        LIMIT 1`
      if (!row) {
        console.warn(`  ⚠ 课文 ${g.lessonNumber} 课未找到，跳过`)
        continue
      }
      lessonId = row.id
    }

    // 3. 清旧 + 写新（保证 position 序列连续，不受历史切分粒度影响）
    await sql`DELETE FROM chinese_lesson_text WHERE lesson_id = ${lessonId}`
    let pos = 0
    for (const it of g.items) {
      pos++
      nItemsWritten++
      await sql`
        INSERT INTO chinese_lesson_text (lesson_id, category, title, author, dynasty, content, position)
        VALUES (${lessonId}, ${it.category}, ${it.title ?? null}, ${it.author ?? null}, ${it.dynasty ?? null}, ${it.content}, ${pos})`
    }
    nLessonsTouched++

    // 自检日志
    const tag = g.isGarden ? `garden@U${g.unitNumber}` : `L${g.lessonNumber}@U${g.unitNumber}`
    const catCount = g.items.reduce((m, it) => {
      m[it.category] = (m[it.category] ?? 0) + 1
      return m
    }, {})
    console.log(`  ✓ ${tag}: ${g.items.length} 条 ${JSON.stringify(catCount)}`)
  }

  console.log(`\n汇总：${nLessonsTouched} 篇目 / ${nItemsWritten} 条课文 / 补建 ${nGardenCreated} 个 garden 课`)
  console.log('完成。')
  await sql.end()
}

main().catch((err) => {
  console.error('\n✗ 执行失败:', err)
  process.exit(1)
})
