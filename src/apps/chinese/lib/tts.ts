/** 本地是否支持 Web Speech API 语音合成 */
function hasSpeechSynthesis(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

// 预热 voices：浏览器页面加载时异步加载，首次 getVoices() 可能返回空数组
if (hasSpeechSynthesis()) {
  window.speechSynthesis.getVoices()
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices()
  }
}

/**
 * 朗读中文词语/句子：本地 Web Speech API（离线、即时）
 */
export function speakWord(text: string, lang = 'zh-CN'): void {
  if (!hasSpeechSynthesis())
    return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  utterance.rate = 0.9
  utterance.pitch = 1
  window.speechSynthesis.speak(utterance)
}

/**
 * 取消当前发音
 */
export function cancelSpeech(): void {
  if (hasSpeechSynthesis()) {
    window.speechSynthesis.cancel()
  }
}
