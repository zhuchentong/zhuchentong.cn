import type { Question } from '../interfaces'
import pinyinDict from '../assets/data/pinyin-dict.json'

interface Syllable {
  pinyin: string
  initial: string | null
  final: string
}

type WordDict = Record<string, Syllable[]>
const dict = pinyinDict as WordDict

const indexByInitial: Record<string, Set<string>> = {}
const indexByFinal: Record<string, Set<string>> = {}

for (const [word, syllables] of Object.entries(dict)) {
  for (const s of syllables) {
    if (s.initial) {
      ;(indexByInitial[s.initial] ??= new Set()).add(word)
    }
    ;(indexByFinal[s.final] ??= new Set()).add(word)
  }
}

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xFFFFFFFF
    return (s >>> 0) / 0xFFFFFFFF
  }
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function countMatches(initials: string[], finals: string[]): number {
  const matchWords = new Set<string>()
  for (const i of initials) {
    indexByInitial[i]?.forEach(w => matchWords.add(w))
  }
  for (const f of finals) {
    indexByFinal[f]?.forEach(w => matchWords.add(w))
  }
  return matchWords.size
}

export function generateQuiz(initials: string[], finals: string[], seed: number, count: number): Question[] {
  const matchWords = new Set<string>()
  for (const i of initials) {
    indexByInitial[i]?.forEach(w => matchWords.add(w))
  }
  for (const f of finals) {
    indexByFinal[f]?.forEach(w => matchWords.add(w))
  }

  const pool: Question[] = []
  for (const word of matchWords) {
    const syllables = dict[word]
    pool.push({
      words: word,
      pinyin: syllables.map(s => s.pinyin),
      highlight: syllables.map(s =>
        (s.initial !== null && initials.includes(s.initial))
        || finals.includes(s.final),
      ),
    })
  }

  const rng = seededRandom(seed)
  return shuffle(pool, rng).slice(0, count)
}
