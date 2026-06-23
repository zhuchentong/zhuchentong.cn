/** YouDao 朗读音频类型：1=英音 2=美音 */
function youdaoType(lang: string): 1 | 2 {
  return lang.startsWith('en-GB') ? 1 : 2
}

// 回退音频实例引用，便于取消
let fallbackAudio: HTMLAudioElement | null = null

/** 本地 Web Speech API 是否有可用语音引擎 */
function hasLocalVoices(): boolean {
  return typeof window !== 'undefined'
    && 'speechSynthesis' in window
    && window.speechSynthesis.getVoices().length > 0
}

/**
 * 朗读英文单词/句子：优先本地 Web Speech API（离线、即时），
 * 本地无语音引擎时回退到 YouDao 在线音频（真实录音，无本地引擎也能用）
 */
export function speakWord(text: string, lang = 'en-US'): void {
  if (typeof window === 'undefined')
    return

  // 停止上一个回退音频，避免重叠
  if (fallbackAudio) {
    fallbackAudio.pause()
    fallbackAudio = null
  }

  // 优先本地 Web Speech API
  if (hasLocalVoices()) {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 0.8
    utterance.pitch = 1
    window.speechSynthesis.speak(utterance)
    return
  }

  // 回退：YouDao 在线发音（音频元素播放不受 CORS 限制）
  fallbackAudio = new Audio(`https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=${youdaoType(lang)}`)
  fallbackAudio.play().catch(() => {})
}

/**
 * 取消当前发音
 */
export function cancelSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
  if (fallbackAudio) {
    fallbackAudio.pause()
    fallbackAudio = null
  }
}
