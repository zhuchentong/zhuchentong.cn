---
name: english-sentence-import
description: Create and run seed scripts to batch-import English textbook sentences (课文句子) into the zhuchentong.cn English learning system. Use when the user provides a list of sentences (English + Chinese translation, organized by units) for a textbook and wants to import them — e.g., "导入四年级上册句子", "add grade 5 sentences", "seed 课文句子". Also use when the user asks to create or update a sentence seed script for any English textbook.
---

# English Sentence Import

## Workflow

1. Confirm textbook metadata matches the corresponding word import: `stage`, `name`, `publisher`, `grade`, `semester`
2. Copy `assets/seed-sentences.template.mjs` to `scripts/seed-grade{N}{a|b}-sentences.mjs` (or appropriate name)
3. Fill in textbook metadata and transform the user's sentences into `{ sentence, translation }` objects per unit — see Data Rules below
4. Run: ensure dev server is up (`pnpm dev`), then `node scripts/seed-grade{N}{a|b}-sentences.mjs`
5. Script is idempotent — safe to re-run; existing sentences are skipped (deduplicated by `textbookId + unitNumber + position`)

## Data Rules

### Apostrophe escaping
Use `\'` inside single-quoted JS strings:
```js
{ sentence: 'What\'s your name?', translation: '你叫什么名字？' }
```

### Multi-sentence entries
Some textbook lines contain multiple sentences (e.g., `"He's also kind. He often helps me."`). Keep them as a single entry — do not split.

### Parenthetical notes in translation
Translations may include contextual notes in parentheses (e.g., `'（在冬天）有很多节日'`). Preserve these as provided by the user.

### Sentence vs word sentence
These are **课文句子** (textbook sentences), stored in `englishSentence` linked to `(textbookId, unitNumber)`. This is separate from word example sentences (`englishWordSentence`). Do not mix the two.

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/english/api/textbooks` | List textbooks (match by `publisher` + `name`) |
| POST | `/english/api/textbooks` | Create textbook |
| POST | `/english/api/batch/sentences` | Batch add sentences: `{ textbookId, sentences: [{ unitNumber, sentence, translation }] }` |

## Existing Examples

Reference these for structure and conventions:
- `scripts/seed-grade3a-sentences.mjs` — 人教版三年级上册
- `scripts/seed-grade3b-sentences.mjs` — 人教版三年级下册
- `scripts/seed-grade4a-sentences.mjs` — 人教版四年级上册
