import type { Question } from '../interfaces'
import allQuestions from '../assets/data/pinyin-questions.json'

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

export function generateQuiz(chapter: number, seed: number, count: number): Question[] {
  const pool = (allQuestions as Question[]).filter(q => q.chapter === chapter)
  const rng = seededRandom(seed)
  return shuffle(pool, rng).slice(0, count)
}
