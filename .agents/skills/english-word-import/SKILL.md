---
name: english-word-import
description: Create and run seed scripts to batch-import English vocabulary into the zhuchentong.cn English learning system. Use when the user provides a vocabulary list (words with phonetics and meanings, organized by units) for a textbook and wants to import it — e.g., "导入四年级上册单词", "add grade 5 words", "seed 新概念英语单词". Also use when the user asks to create or update a word seed script for any English textbook.
---

# English Word Import

## Workflow

1. Confirm textbook metadata with the user: `stage` (学段), `name` (册次), `publisher` (出版社), `grade` (年级), `semester` (学期)
2. Copy `assets/seed-words.template.mjs` to `scripts/seed-grade{N}{a|b}-words.mjs` (or appropriate name)
3. Fill in textbook metadata and transform the user's vocabulary into `[word, phonetic, meaning]` tuples per unit — see Data Rules below
4. Run: ensure dev server is up (`pnpm dev`), then `node scripts/seed-grade{N}{a|b}-words.mjs`
5. Script is idempotent — safe to re-run; existing words update meaning, associations deduplicate

## Data Rules

### Cross-unit duplicate words
Words are globally deduplicated (one row per unique word string). If a word appears in multiple units with different meanings, define a merge constant and use it in both units:
```js
const COOK_MEANING = '烹饪；煮；厨师'
// Unit 1: ['cook', '/kʊk/', COOK_MEANING]
// Unit 4: ['cook', '/kʊk/', COOK_MEANING]
```

### Capitalization
- Proper nouns, titles, abbreviations: keep original case (`PE`, `Ms`, `Chinese`, `Sydney`, `T-shirt`)
- All other words: lowercase

### Phrases
Multi-word entries (`office worker`, `look after`, `a lot of`) are single word entries with the full phrase as the `word` field.

### Irregular plurals
Annotate the plural form in the meaning: `'儿童；小孩（复数 children）'`

### IPA normalization
Convert user input to proper Unicode IPA:
- Length mark: `ː` (not `:`)
- Primary stress: `ˈ` (not `'`)
- Secondary stress: `ˌ`
- Rhotic variant: `(r)`
- Use `；` (Chinese semicolon) to separate multiple meanings

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/english/api/textbooks` | List textbooks (match by `publisher` + `name`) |
| POST | `/english/api/textbooks` | Create textbook |
| POST | `/english/api/batch/words` | Batch add words: `{ textbookId, words: [{ unitNumber, word, phonetic, meaning }] }` |

## Existing Examples

Reference these for structure and conventions:
- `scripts/seed-grade3a-words.mjs` — 人教版三年级上册 (orange merge pattern)
- `scripts/seed-grade3-words.mjs` — 人教版三年级下册
- `scripts/seed-grade4a-words.mjs` — 人教版四年级上册 (cook merge pattern)
