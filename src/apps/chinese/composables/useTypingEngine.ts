import { toPinyinTarget } from '@chinese/lib/pinyin'

import { useCallback, useEffect, useRef, useState } from 'react'

/** 单个打字练习条目，内容无关（词语/生字/课文句子通用） */
export interface TypingItem {
  /** 展示文本（如「春天」），仅用于显示 */
  display: string
  /** 带声调拼音（如「chūn tiān」），仅用于提示 */
  pinyin: string
  /** 去声调比对串（如「chuntian」），实际逐键比对，纯 a-z */
  target: string
  /** 类别标签，用于错题展示 */
  category: string
  /** 可选元数据（古诗题/作者/朝代/成语出处），仅用于 display 上方提示，不参与打字 */
  meta?: { title?: string, dynasty?: string, author?: string, source?: string }
}

type CharStatus = 'idle' | 'correct' | 'wrong'
type Phase = 'learning' | 'finished'

export interface UseTypingEngineOptions {
  /** 已构造好的练习条目（组件 fetch 完成后传入，引用稳定时只初始化一次） */
  items: TypingItem[]
  /** 打字音效开关 */
  soundEnabled: boolean
  /** 自动朗读开关 */
  autoSpeak: boolean
  /** 注入的音效资源路径 */
  audio: { correct: string, incorrect: string, keydown: string }
  /** 朗读回调（组件决定 lang/文本） */
  onSpeak?: (item: TypingItem) => void
  /** Esc 退出回调（组件决定跳转目标） */
  onExit: () => void
  /**
   * 错键处理模式：
   * - 'reset'（默认）：闪屏 + 整条重置（适合短条目：字/词）
   * - 'continue'：标记错误后继续，不重置（适合长条目：句子/古诗）
   */
  wrongKeyMode?: 'reset' | 'continue'
  /**
   * 是否打乱条目顺序：
   * - true（默认）：shuffle，适合字/词巩固记忆
   * - false：保持原序，适合课文/古诗按阅读顺序练习
   */
  shuffle?: boolean
}

export interface UseTypingEngineState {
  phase: Phase
  started: boolean
  showAnswer: boolean
  setShowAnswer: (v: boolean) => void
  current: TypingItem | null
  items: TypingItem[]
  currentIndex: number
  charIndex: number
  inputStatus: CharStatus[]
  wrongFlash: boolean
  elapsed: number
  totalInputs: number
  correctInputs: number
  correctItems: number
  errors: Set<string>
  progress: number
  wpm: string
  accuracy: string
  restart: () => void
}

/** Fisher-Yates 洗牌 */
function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 播放音效，自动重置到开头避免重叠 */
function playSound(el: HTMLAudioElement | null) {
  if (!el)
    return
  el.currentTime = 0
  el.play().catch(() => {})
}

/** 用秒数格式化 mm:ss */
export function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** 按 target 长度初始化字符状态数组 */
function initStatus(target: string): CharStatus[] {
  return target.split('').map(() => 'idle' as CharStatus)
}

/**
 * 计算拼音各音节在 target 中的字母范围 [start, end)
 * 用于错键时只重置当前字（音节）而非整条
 * "chūn tiān" → [[0,4],[4,8]]（"chun" 4 字母，"tian" 4 字母）
 */
function computeSyllableRanges(pinyin: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = []
  let idx = 0
  for (const syl of pinyin.split(/\s+/).filter(Boolean)) {
    const len = toPinyinTarget(syl).length
    ranges.push([idx, idx + len])
    idx += len
  }
  return ranges
}

/**
 * 通用打字引擎：封装逐键匹配状态机、全局键盘监听、计时与统计。
 * 组件只需构造 TypingItem[] 并负责渲染。
 */
export function useTypingEngine(opts: UseTypingEngineOptions): UseTypingEngineState {
  const { items, soundEnabled, autoSpeak, audio, onSpeak, onExit, wrongKeyMode = 'reset', shuffle = true } = opts

  const [phase, setPhase] = useState<Phase>('learning')
  const [shuffled, setShuffled] = useState<TypingItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [inputStatus, setInputStatus] = useState<CharStatus[]>([])
  const [wrongFlash, setWrongFlash] = useState(false)
  const [started, setStarted] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [totalInputs, setTotalInputs] = useState(0)
  const [correctInputs, setCorrectInputs] = useState(0)
  const [correctItems, setCorrectItems] = useState(0)
  const [errors, setErrors] = useState<Set<string>>(() => new Set())

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const completeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())
  const isResettingRef = useRef(false)
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const correctSoundRef = useRef<HTMLAudioElement | null>(null)
  const incorrectSoundRef = useRef<HTMLAudioElement | null>(null)
  const keydownSoundRef = useRef<HTMLAudioElement | null>(null)

  // 回调用 ref 承载，避免 keydown effect 因回调引用变化频繁重订阅
  const onSpeakRef = useRef(onSpeak)
  const onExitRef = useRef(onExit)
  useEffect(() => {
    onSpeakRef.current = onSpeak
  }, [onSpeak])
  useEffect(() => {
    onExitRef.current = onExit
  }, [onExit])

  // items 变化时（组件 fetch 完成后首次注入）初始化整局
  useEffect(() => {
    if (items.length === 0)
      return
    /* eslint-disable react/set-state-in-effect -- 外部数据注入后初始化引擎内部状态，是标准的 prop→state 同步模式 */
    const resh = shuffle ? shuffleArr(items) : [...items]
    setShuffled(resh)
    setCurrentIndex(0)
    setCharIndex(0)
    setInputStatus(initStatus(resh[0]?.target ?? ''))
    setElapsed(0)
    setTotalInputs(0)
    setCorrectInputs(0)
    setCorrectItems(0)
    setErrors(new Set())
    setStarted(false)
    setShowAnswer(false)
    setWrongFlash(false)
    setPhase('learning')
    /* eslint-enable react/set-state-in-effect */
  }, [items, shuffle])

  // 预加载音效
  useEffect(() => {
    correctSoundRef.current = new Audio(audio.correct)
    incorrectSoundRef.current = new Audio(audio.incorrect)
    keydownSoundRef.current = new Audio(audio.keydown)
  }, [audio.correct, audio.incorrect, audio.keydown])

  // 计时器
  useEffect(() => {
    if (phase === 'learning' && started) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [phase, started])

  // 卸载时清理全部定时器与朗读
  useEffect(() => {
    const pending = pendingTimeoutsRef.current
    return () => {
      if (timerRef.current)
        clearInterval(timerRef.current)
      if (completeTimeoutRef.current)
        clearTimeout(completeTimeoutRef.current)
      if (resetTimeoutRef.current)
        clearTimeout(resetTimeoutRef.current)
      for (const id of pending)
        clearTimeout(id)
    }
  }, [])

  // 自动发音（当前条目变化时）
  useEffect(() => {
    if (!started || phase !== 'learning' || !autoSpeak)
      return
    const cur = shuffled[currentIndex]
    if (cur && onSpeakRef.current) {
      const t = setTimeout(() => onSpeakRef.current?.(cur), 100)
      return () => clearTimeout(t)
    }
    return undefined
  }, [currentIndex, phase, started, autoSpeak, shuffled])

  const goToNext = useCallback(() => {
    completeTimeoutRef.current = null
    setShowAnswer(false)
    setCurrentIndex((prev) => {
      const next = prev + 1
      if (next >= shuffled.length) {
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
        setPhase('finished')
        return prev
      }
      setCharIndex(0)
      setInputStatus(initStatus(shuffled[next].target))
      return next
    })
  }, [shuffled])

  // 全局键盘监听
  useEffect(() => {
    if (phase !== 'learning' || shuffled.length === 0)
      return
    const pendingTimeouts = pendingTimeoutsRef.current

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isResettingRef.current)
        return

      // 未开始：等待任意键启动。启动键仅用于启动，不计入答题输入
      if (!started) {
        if (e.key === 'Escape') {
          onExitRef.current()
          return
        }
        if (e.key.length > 1)
          return
        e.preventDefault()
        setStarted(true)
        return
      }

      if (e.key === 'Escape') {
        onExitRef.current()
        return
      }

      // 忽略功能键
      if (e.key.length > 1 && e.key !== 'Backspace')
        return

      const item = shuffled[currentIndex]
      if (!item)
        return

      // 答案模式：按任意键隐藏答案并重置当前输入
      if (showAnswer) {
        setShowAnswer(false)
        if (resetTimeoutRef.current) {
          clearTimeout(resetTimeoutRef.current)
          resetTimeoutRef.current = null
        }
        if (completeTimeoutRef.current) {
          clearTimeout(completeTimeoutRef.current)
          completeTimeoutRef.current = null
        }
        isResettingRef.current = false
        setCharIndex(0)
        setInputStatus(initStatus(item.target))
        return
      }

      if (e.key === 'Backspace') {
        if (charIndex > 0) {
          const newIdx = charIndex - 1
          setCharIndex(newIdx)
          setInputStatus(prev => [...prev].map((s, i) => (i === newIdx ? 'idle' : s)))
        }
        return
      }

      const expected = item.target[charIndex]
      if (expected === undefined)
        return

      if (soundEnabled)
        playSound(keydownSoundRef.current)
      setTotalInputs(c => c + 1)

      if (e.key.toLowerCase() === expected.toLowerCase()) {
        // 正确
        setCorrectInputs(c => c + 1)
        setWrongFlash(false)
        setInputStatus(prev => [...prev].map((s, i) => (i === charIndex ? 'correct' : s)))

        const nextIdx = charIndex + 1
        if (nextIdx >= item.target.length) {
          setCorrectItems(c => c + 1)
          if (soundEnabled)
            playSound(correctSoundRef.current)
          if (completeTimeoutRef.current)
            clearTimeout(completeTimeoutRef.current)
          completeTimeoutRef.current = setTimeout(goToNext, 500)
        }
        setCharIndex(nextIdx)
      }
      else {
        // 错误处理：默认 reset 模式（闪屏 + 整条重置）；continue 模式仅标记错误后继续
        if (soundEnabled)
          playSound(incorrectSoundRef.current)
        setErrors(prev => new Set(prev).add(item.display))

        if (wrongKeyMode === 'continue') {
          // 标错不重置：当前键标红，charIndex 前进
          setInputStatus(prev => [...prev].map((s, i) => (i === charIndex ? 'wrong' : s)))
          setWrongFlash(true)
          const flashId = setTimeout(setWrongFlash, 200, false) // eslint-disable-line react/web-api-no-leaked-timeout -- timeout 由 pendingTimeouts 跟踪
          pendingTimeouts.add(flashId)

          const nextIdx = charIndex + 1
          // 即使标错也继续推进；若到末尾，仍按完成处理（用户已"打完"整句）
          if (nextIdx >= item.target.length) {
            setCorrectItems(c => c + 1)
            if (soundEnabled)
              playSound(correctSoundRef.current)
            if (completeTimeoutRef.current)
              clearTimeout(completeTimeoutRef.current)
            completeTimeoutRef.current = setTimeout(goToNext, 500)
          }
          setCharIndex(nextIdx)
          return
        }

        // reset 模式：闪屏 + 整条重置
        setWrongFlash(true)
        isResettingRef.current = true
        const flashId = setTimeout(setWrongFlash, 300, false) // eslint-disable-line react/web-api-no-leaked-timeout -- timeout 由 pendingTimeouts 跟踪，cleanup 中清理
        pendingTimeouts.add(flashId)
        setInputStatus(prev => [...prev].map((s, i) => (i === charIndex ? 'wrong' : s)))

        if (resetTimeoutRef.current)
          clearTimeout(resetTimeoutRef.current)
        resetTimeoutRef.current = setTimeout(() => {
          resetTimeoutRef.current = null
          const cur = shuffled[currentIndex]
          if (!cur) {
            isResettingRef.current = false
            return
          }
          // 音节级重置：只清空当前错误字（音节）的拼音字母，保留其他已打对的字
          const ranges = computeSyllableRanges(cur.pinyin)
          const range = ranges.find(([s, e]) => charIndex >= s && charIndex < e)
            ?? [0, cur.target.length] // 兜底：找不到则整条重置
          const [start, end] = range
          setInputStatus(prev => prev.map((s, i) => (i >= start && i < end ? 'idle' : s)))
          setCharIndex(start)
          isResettingRef.current = false
          if (completeTimeoutRef.current) {
            clearTimeout(completeTimeoutRef.current)
            completeTimeoutRef.current = null
          }
          if (autoSpeak && onSpeakRef.current)
            onSpeakRef.current(cur)
        }, 300)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      for (const id of pendingTimeouts)
        clearTimeout(id)
      pendingTimeouts.clear()
    }
  }, [phase, currentIndex, charIndex, shuffled, soundEnabled, autoSpeak, showAnswer, started, wrongKeyMode, goToNext])

  const restart = useCallback(() => {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current)
      resetTimeoutRef.current = null
    }
    isResettingRef.current = false
    setShowAnswer(false)
    if (completeTimeoutRef.current) {
      clearTimeout(completeTimeoutRef.current)
      completeTimeoutRef.current = null
    }
    const sourceArr = shuffled.length > 0 ? shuffled : items
    const resh = shuffle ? shuffleArr(sourceArr) : [...items]
    setShuffled(resh)
    setCurrentIndex(0)
    setCharIndex(0)
    setInputStatus(initStatus(resh[0]?.target ?? ''))
    setElapsed(0)
    setTotalInputs(0)
    setCorrectInputs(0)
    setCorrectItems(0)
    setErrors(new Set())
    setWrongFlash(false)
    setPhase('learning')
  }, [shuffled, items, shuffle])

  const progress = shuffled.length > 0 ? ((currentIndex + 1) / shuffled.length) * 100 : 0
  const wpm = elapsed > 0 ? (correctItems / (elapsed / 60)).toFixed(1) : '0.0'
  const accuracy = totalInputs > 0 ? ((correctInputs / totalInputs) * 100).toFixed(1) : '100.0'

  return {
    phase,
    started,
    showAnswer,
    setShowAnswer,
    current: shuffled[currentIndex] ?? null,
    items: shuffled,
    currentIndex,
    charIndex,
    inputStatus,
    wrongFlash,
    elapsed,
    totalInputs,
    correctInputs,
    correctItems,
    errors,
    progress,
    wpm,
    accuracy,
    restart,
  }
}
