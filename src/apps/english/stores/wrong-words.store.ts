import { persistentJSON } from '@nanostores/persistent'

export interface WrongWord {
  word: string
  meaning: string
  errorCount: number
  firstSeenAt: number
  lastSeenAt: number
}

export const wrongWords = persistentJSON<WrongWord[]>('english/wrong-words', [])

export function addWrongWord(word: string, meaning = '') {
  const key = word.trim().toLowerCase()
  if (!key)
    return
  const now = Date.now()
  const prev = wrongWords.get()
  const idx = prev.findIndex(w => w.word.toLowerCase() === key)

  if (idx === -1) {
    wrongWords.set([
      { word: word.trim(), meaning, errorCount: 1, firstSeenAt: now, lastSeenAt: now },
      ...prev,
    ])
  }
  else {
    const next = [...prev]
    const existing = next[idx]
    next[idx] = {
      ...existing,
      meaning: existing.meaning || meaning,
      errorCount: existing.errorCount + 1,
      lastSeenAt: now,
    }
    wrongWords.set(next)
  }
}

export function removeWrongWord(word: string) {
  const key = word.trim().toLowerCase()
  wrongWords.set(wrongWords.get().filter(w => w.word.toLowerCase() !== key))
}

export function clearWrongWords() {
  wrongWords.set([])
}
