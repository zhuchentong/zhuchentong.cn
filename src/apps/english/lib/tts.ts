/** YouDao 朗读音频类型：1=英音 2=美音 */
function youdaoType(lang: string): 1 | 2 {
  return lang.startsWith('en-GB') ? 1 : 2
}

// 回退音频实例引用，便于取消
let fallbackAudio: HTMLAudioElement | null = null

/** 本地是否支持 Web Speech API 语音合成 */
function hasSpeechSynthesis(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

// 预热 voices：浏览器页面加载时异步加载 voices，首次 getVoices() 可能返回空数组
if (hasSpeechSynthesis()) {
  window.speechSynthesis.getVoices()
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices()
  }
}

/**
 * 朗读英文单词/句子：优先本地 Web Speech API（离线、即时），
 * 无本地引擎时回退到 YouDao 在线音频
 *
 * 刷新页面时 voices 尚未异步加载，getVoices() 返回空数组，
 * 但 speechSynthesis.speak() 仍可调用，且比 Audio.play() 更不易被自动播放策略拦截。
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
  if (hasSpeechSynthesis()) {
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
  if (hasSpeechSynthesis()) {
    window.speechSynthesis.cancel()
  }
  if (fallbackAudio) {
    fallbackAudio.pause()
    fallbackAudio = null
  }
}
