/**
 * 使用 Web Speech API 朗读英文单词
 */
export function speakWord(word: string, lang = 'en-US'): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return
  }
  speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(word)
  utterance.lang = lang
  utterance.rate = 0.8
  utterance.pitch = 1

  speechSynthesis.speak(utterance)
}

/**
 * 取消当前发音
 */
export function cancelSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    speechSynthesis.cancel()
  }
}
