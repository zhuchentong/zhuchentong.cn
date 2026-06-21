import type { TextbookSentenceResult } from '@english/interfaces'
import type { EnglishTextbook } from '@/database/schema'

import correctAudio from '@english/assets/audio/correct.wav'
import incorrectAudio from '@english/assets/audio/incorrect.wav'
import keydownAudio from '@english/assets/audio/keydown.wav'
import { apiRequest } from '@english/lib/request'
import { cancelSpeech, speakWord } from '@english/lib/tts'
import { Icon } from '@iconify/react'
import { useStore } from '@nanostores/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import * as AppStore from '@/stores/app.store'

type Phase = 'learning' | 'finished'

interface ErrorRecord {
  sentence: string
  typed: string
}

interface SentenceLearnerProps {
  initialTextbookId: number
  initialUnitNumber: number
}

/** Fisher-Yates 洗牌 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 跳过空格，返回下一个非空格位置 */
function skipSpaces(word: string, startIndex: number): number {
  let idx = startIndex
  while (idx < word.length && word[idx] === ' ') {
    idx++
  }
  return idx
}

/** 播放音效，自动重置到开头避免重叠 */
function playSound(el: HTMLAudioElement | null) {
  if (!el)
    return
  el.currentTime = 0
  el.play().catch(() => {})
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function SentenceLearner({ initialTextbookId, initialUnitNumber }: SentenceLearnerProps) {
  // === 主题 ===
  const theme = useStore(AppStore.theme)

  // === 课本信息 ===
  const [textbookId] = useState<number>(initialTextbookId)
  const [unitNumber] = useState<number>(initialUnitNumber)
  const [textbookInfo, setTextbookInfo] = useState<EnglishTextbook | null>(null)
  const [unitNumbers, setUnitNumbers] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  // === 学习阶段状态 ===
  const [phase, setPhase] = useState<Phase>('learning')
  const [sentences, setSentences] = useState<TextbookSentenceResult[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [inputStatus, setInputStatus] = useState<('idle' | 'correct' | 'wrong')[]>([])
  const [typedChars, setTypedChars] = useState<string[]>([])
  const [wrongFlash, setWrongFlash] = useState(false)

  // === 功能条状态 ===
  const [accent, setAccent] = useState<'en-US' | 'en-GB'>('en-US')
  const [dictationMode, setDictationMode] = useState(false)
  const [hideTranslation, setHideTranslation] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)

  // === 统计 ===
  const [elapsed, setElapsed] = useState(0)
  const [totalInputs, setTotalInputs] = useState(0)
  const [correctInputs, setCorrectInputs] = useState(0)
  const [correctSentences, setCorrectSentences] = useState(0)
  const [errors, setErrors] = useState<Map<string, ErrorRecord>>(() => new Map())

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sentenceCompleteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())
  const currentTypedRef = useRef('')
  const isResettingRef = useRef(false)
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const correctSoundRef = useRef<HTMLAudioElement | null>(null)
  const incorrectSoundRef = useRef<HTMLAudioElement | null>(null)
  const keydownSoundRef = useRef<HTMLAudioElement | null>(null)

  const resetToGallery = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (sentenceCompleteTimeoutRef.current) {
      clearTimeout(sentenceCompleteTimeoutRef.current)
      sentenceCompleteTimeoutRef.current = null
    }
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current)
      resetTimeoutRef.current = null
    }
    isResettingRef.current = false
    cancelSpeech()
    window.location.href = '/english/gallery?type=sentence'
  }, [])

  const goToNextSentence = useCallback(() => {
    sentenceCompleteTimeoutRef.current = null
    setCurrentIndex((prevIndex) => {
      const nextIndex = prevIndex + 1
      if (nextIndex >= sentences.length) {
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
        cancelSpeech()
        setPhase('finished')
        return prevIndex
      }
      const nextSentence = sentences[nextIndex]
      const firstCharIdx = skipSpaces(nextSentence.sentence, 0)
      setCharIndex(firstCharIdx)
      setInputStatus(nextSentence.sentence.split('').map(ch => ch === ' ' ? 'correct' : 'idle') as ('idle' | 'correct' | 'wrong')[])
      setTypedChars(nextSentence.sentence.split('').map(ch => ch === ' ' ? ' ' : ''))
      currentTypedRef.current = ''
      return nextIndex
    })
  }, [sentences])

  // === 加载课本信息和单元列表，并自动开始学习 ===
  useEffect(() => {
    const loadData = async () => {
      try {
        // 加载课本信息
        const textbooks = await apiRequest<EnglishTextbook[]>(`/english/api/textbooks`)
        const textbook = textbooks.find(tb => tb.id === textbookId)
        if (textbook) {
          setTextbookInfo(textbook)
        }

        // 加载单元列表
        const units = await apiRequest<number[]>(`/english/api/units?textbookId=${textbookId}`)
        setUnitNumbers(units)

        // 加载课文句子并开始学习
        const data = await apiRequest<TextbookSentenceResult[]>(
          `/english/api/sentences?textbookId=${textbookId}&unitNumber=${unitNumber}`,
        )
        if (data.length === 0) {
          alert('该单元暂无课文句子')
          window.location.href = '/english/gallery?type=sentence'
          return
        }
        const shuffled = shuffle(data)
        const firstSentence = shuffled[0]
        const firstCharIdx = skipSpaces(firstSentence.sentence, 0)
        setSentences(shuffled)
        setCurrentIndex(0)
        setCharIndex(firstCharIdx)
        setInputStatus(firstSentence.sentence.split('').map(ch => ch === ' ' ? 'correct' : 'idle') as ('idle' | 'correct' | 'wrong')[])
        setTypedChars(firstSentence.sentence.split('').map(ch => ch === ' ' ? ' ' : ''))
      }
      catch (err) {
        console.error('加载数据失败:', err)
        alert('加载数据失败，请重试')
        window.location.href = '/english/gallery?type=sentence'
      }
      finally {
        setLoading(false)
      }
    }
    loadData()
  }, [textbookId, unitNumber])

  // === 预加载音效 ===
  useEffect(() => {
    correctSoundRef.current = new Audio(correctAudio)
    incorrectSoundRef.current = new Audio(incorrectAudio)
    keydownSoundRef.current = new Audio(keydownAudio)
  }, [])

  // === 计时器 ===
  useEffect(() => {
    if (phase === 'learning') {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [phase])

  // === 自动发音 ===
  useEffect(() => {
    if (phase === 'learning' && autoSpeak && sentences[currentIndex]) {
      const timer = setTimeout(() => {
        speakWord(sentences[currentIndex].sentence, accent)
      }, 100)
      return () => clearTimeout(timer)
    }
    return () => cancelSpeech()
  }, [currentIndex, phase, sentences, autoSpeak, accent])

  // === 全局键盘监听 ===
  useEffect(() => {
    if (phase !== 'learning')
      return

    const pendingTimeouts = pendingTimeoutsRef.current

    const handleKeyDown = (e: KeyboardEvent) => {
      // 重置过程中忽略所有输入
      if (isResettingRef.current)
        return

      // Esc 返回选择
      if (e.key === 'Escape') {
        resetToGallery()
        return
      }

      // 忽略功能键
      if (e.key.length > 1 && e.key !== 'Backspace')
        return

      const sentence = sentences[currentIndex]
      if (!sentence)
        return

      if (e.key === 'Backspace') {
        if (charIndex > 0) {
          let newIdx = charIndex - 1
          // 跳过空格位置
          while (newIdx > 0 && sentence.sentence[newIdx] === ' ') {
            newIdx--
          }
          // 如果当前位置是空格，不处理
          if (sentence.sentence[newIdx] === ' ')
            return
          setCharIndex(newIdx)
          setInputStatus((prev) => {
            const next = [...prev]
            next[newIdx] = 'idle'
            return next
          })
          setTypedChars((prev) => {
            const next = [...prev]
            next[newIdx] = ''
            return next
          })
          currentTypedRef.current = currentTypedRef.current.slice(0, -1)
        }
        return
      }

      // 字母输入
      const expected = sentence.sentence[charIndex]
      if (expected === undefined)
        return

      // 如果当前位置是空格，自动跳过
      if (expected === ' ') {
        setCharIndex(skipSpaces(sentence.sentence, charIndex))
        return
      }

      // 如果按的是空格键，忽略（不算出错）
      if (e.key === ' ') {
        return
      }

      if (soundEnabled)
        playSound(keydownSoundRef.current)
      setTotalInputs(c => c + 1)

      if (e.key.toLowerCase() === expected.toLowerCase()) {
        // 正确
        setCorrectInputs(c => c + 1)
        setWrongFlash(false)
        setInputStatus((prev) => {
          const next = [...prev]
          next[charIndex] = 'correct'
          return next
        })
        setTypedChars((prev) => {
          const next = [...prev]
          next[charIndex] = e.key
          return next
        })
        currentTypedRef.current += e.key

        const nextCharIndex = skipSpaces(sentence.sentence, charIndex + 1)
        if (nextCharIndex >= sentence.sentence.length) {
          // 句子完成
          setCorrectSentences(c => c + 1)
          if (soundEnabled)
            playSound(correctSoundRef.current)
          if (sentenceCompleteTimeoutRef.current)
            clearTimeout(sentenceCompleteTimeoutRef.current)
          sentenceCompleteTimeoutRef.current = setTimeout(goToNextSentence, 500)
        }
        setCharIndex(nextCharIndex)
      }
      else {
        // 错误
        if (soundEnabled)
          playSound(incorrectSoundRef.current)
        setWrongFlash(true)
        isResettingRef.current = true
        const flashTimeoutId = setTimeout(setWrongFlash, 300, false) // eslint-disable-line react/web-api-no-leaked-timeout -- timeout tracked via pendingTimeouts, cleared in cleanup
        pendingTimeouts.add(flashTimeoutId)
        setInputStatus((prev) => {
          const next = [...prev]
          next[charIndex] = 'wrong'
          return next
        })
        setTypedChars((prev) => {
          const next = [...prev]
          next[charIndex] = e.key
          return next
        })
        currentTypedRef.current += e.key

        // 记录错误（无条件更新，记录最后一次错误）
        setErrors((prev) => {
          const next = new Map(prev)
          next.set(sentence.sentence, { sentence: sentence.sentence, typed: currentTypedRef.current })
          return next
        })

        // 300ms后重置整个句子输入
        if (resetTimeoutRef.current) {
          clearTimeout(resetTimeoutRef.current)
        }
        resetTimeoutRef.current = setTimeout(() => {
          resetTimeoutRef.current = null
          const currentSentence = sentences[currentIndex]
          if (!currentSentence) {
            isResettingRef.current = false
            return
          }

          const firstCharIdx = skipSpaces(currentSentence.sentence, 0)
          setCharIndex(firstCharIdx)
          setInputStatus(currentSentence.sentence.split('').map(ch => ch === ' ' ? 'correct' : 'idle') as ('idle' | 'correct' | 'wrong')[])
          setTypedChars(currentSentence.sentence.split('').map(ch => ch === ' ' ? ' ' : ''))
          currentTypedRef.current = ''
          isResettingRef.current = false

          if (sentenceCompleteTimeoutRef.current) {
            clearTimeout(sentenceCompleteTimeoutRef.current)
            sentenceCompleteTimeoutRef.current = null
          }

          if (autoSpeak) {
            speakWord(currentSentence.sentence, accent)
          }
        }, 300)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      for (const id of pendingTimeouts) {
        clearTimeout(id)
      }
      pendingTimeouts.clear()
    }
  }, [phase, currentIndex, charIndex, sentences, errors, soundEnabled, resetToGallery, goToNextSentence])

  const restartWithSameSentences = () => {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current)
      resetTimeoutRef.current = null
    }
    isResettingRef.current = false
    const shuffled = shuffle(sentences)
    const firstSentence = shuffled[0]
    const firstCharIdx = skipSpaces(firstSentence.sentence, 0)
    setSentences(shuffled)
    setCurrentIndex(0)
    setCharIndex(firstCharIdx)
    setInputStatus(firstSentence.sentence.split('').map(ch => ch === ' ' ? 'correct' : 'idle') as ('idle' | 'correct' | 'wrong')[])
    setTypedChars(firstSentence.sentence.split('').map(ch => ch === ' ' ? ' ' : ''))
    setElapsed(0)
    setTotalInputs(0)
    setCorrectInputs(0)
    setCorrectSentences(0)
    setErrors(new Map())
    currentTypedRef.current = ''
    setPhase('learning')
  }

  const goToNextUnit = useCallback(async () => {
    if (!textbookId || unitNumber === null)
      return

    const currentIdx = unitNumbers.indexOf(unitNumber)
    if (currentIdx === -1 || currentIdx >= unitNumbers.length - 1) {
      alert('已经是最后一个单元')
      return
    }

    const nextUnit = unitNumbers[currentIdx + 1]
    window.location.href = `/english/learner?type=sentence&textbookId=${textbookId}&unitNumber=${nextUnit}`
  }, [textbookId, unitNumber, unitNumbers])

  const startDictation = useCallback(() => {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current)
      resetTimeoutRef.current = null
    }
    isResettingRef.current = false
    setDictationMode(true)
    const shuffled = shuffle(sentences)
    const firstSentence = shuffled[0]
    const firstCharIdx = skipSpaces(firstSentence.sentence, 0)
    setSentences(shuffled)
    setCurrentIndex(0)
    setCharIndex(firstCharIdx)
    setInputStatus(firstSentence.sentence.split('').map(ch => ch === ' ' ? 'correct' : 'idle') as ('idle' | 'correct' | 'wrong')[])
    setTypedChars(firstSentence.sentence.split('').map(ch => ch === ' ' ? ' ' : ''))
    setElapsed(0)
    setTotalInputs(0)
    setCorrectInputs(0)
    setCorrectSentences(0)
    setErrors(new Map())
    currentTypedRef.current = ''
    setPhase('learning')
  }, [sentences])

  const wpm = elapsed > 0 ? (correctSentences / (elapsed / 60)).toFixed(1) : '0.0'
  const accuracy = totalInputs > 0 ? ((correctInputs / totalInputs) * 100).toFixed(1) : '100.0'

  // 加载中状态
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    )
  }

  // === 学习阶段 ===
  if (phase === 'learning') {
    const currentSentence = sentences[currentIndex]
    const progress = ((currentIndex + 1) / sentences.length) * 100

    return (
      <div
        className={`flex h-full flex-col bg-background transition-colors ${wrongFlash ? 'bg-red-50 dark:bg-red-950/30' : ''}`}
      >
        {/* 功能条 */}
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <div className="flex items-center gap-4">
            {/* 课本信息 */}
            <span className="text-sm text-muted-foreground">
              {textbookInfo && `${textbookInfo.stage} · ${textbookInfo.publisher} · ${textbookInfo.name}`}
              {' '}
              {`Unit ${unitNumber}`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* 发音切换 */}
            <button
              className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={() => setAccent(accent === 'en-US' ? 'en-GB' : 'en-US')}
            >
              <Icon icon="icon-park-outline:voice-one" className="size-4" />
              <span>{accent === 'en-US' ? '美式' : '英式'}</span>
            </button>

            {/* 分隔线 */}
            <div className="h-4 w-px bg-border" />

            {/* 默写模式 */}
            <label className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground">
              <Switch
                size="sm"
                checked={dictationMode}
                onCheckedChange={setDictationMode}
              />
              <span>默写</span>
            </label>

            {/* 隐藏翻译 */}
            <label className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground">
              <Switch
                size="sm"
                checked={hideTranslation}
                onCheckedChange={setHideTranslation}
              />
              <span>翻译</span>
            </label>

            {/* 分隔线 */}
            <div className="h-4 w-px bg-border" />

            {/* 主题切换 */}
            <button
              className="flex items-center rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={() => AppStore.updateTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <Icon icon={theme === 'dark' ? 'icon-park-outline:moon' : 'icon-park-outline:sun-one'} className="size-4" />
            </button>

            {/* 分隔线 */}
            <div className="h-4 w-px bg-border" />

            {/* 自动发音 */}
            <label className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground">
              <Switch
                size="sm"
                checked={autoSpeak}
                onCheckedChange={setAutoSpeak}
              />
              <Icon icon="icon-park-outline:volume-small" className="size-4" />
            </label>

            {/* 打字音效 */}
            <label className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground">
              <Switch
                size="sm"
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
              />
              <Icon icon="icon-park-outline:keyboard-one" className="size-4" />
            </label>

            {/* 返回按钮 */}
            <Button variant="ghost" size="sm" onClick={resetToGallery}>
              Esc 返回
            </Button>
          </div>
        </div>

        {/* 主内容区 - 居中显示 */}
        <div className="flex flex-1 flex-col items-center justify-center">
          {/* 句子显示 */}
          <div className="mb-8 text-center">
            <div className="mb-4 font-mono text-4xl font-bold tracking-wider">
              {currentSentence.sentence.split('').map((ch, i) => {
                // 空格显示为 ␣
                if (ch === ' ') {
                  return <span key={`${ch}-${i}`} className="inline-block text-muted-foreground/40">␣</span>
                }
                if (dictationMode) {
                  const typed = typedChars[i]
                  if (!typed)
                    return <span key={`${ch}-${i}`} className="inline-block text-muted-foreground">_</span>
                  const isCorrect = typed.toLowerCase() === ch.toLowerCase()
                  return (
                    <span key={`${ch}-${i}`} className={`inline-block transition-colors ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                      {typed}
                    </span>
                  )
                }
                let color = 'text-muted-foreground/40'
                if (inputStatus[i] === 'correct')
                  color = 'text-green-500'
                else if (inputStatus[i] === 'wrong')
                  color = 'text-red-500'
                return (
                  <span key={`${ch}-${i}`} className={`${color} inline-block transition-colors`}>
                    {ch}
                  </span>
                )
              })}
            </div>
            {!hideTranslation && currentSentence.translation && (
              <p className="text-xl text-muted-foreground">{currentSentence.translation}</p>
            )}
          </div>

          {/* 进度条 */}
          <div className="w-full max-w-lg px-6">
            <Progress value={progress} className="mb-2 h-1.5" />
            <p className="text-center text-sm text-muted-foreground">
              {currentIndex + 1}
              {' / '}
              {sentences.length}
            </p>
          </div>
        </div>

        {/* 底部统计栏 */}
        <div className="border-t border-border bg-card px-6 py-4">
          <div className="mx-auto flex max-w-lg items-center justify-between">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">用时</p>
              <p className="font-mono text-lg font-semibold">{formatTime(elapsed)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">速度</p>
              <p className="font-mono text-lg font-semibold">
                {wpm}
                {' '}
                <span className="text-xs font-normal">WPM</span>
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">正确数</p>
              <p className="font-mono text-lg font-semibold">{correctSentences}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">正确率</p>
              <p className="font-mono text-lg font-semibold">
                {accuracy}
                <span className="text-xs font-normal">%</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // === 完成阶段 ===
  const errorList = Array.from(errors.values())

  return (
    <div className="flex h-full items-center justify-center bg-background p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl">学习完成！</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 统计 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-4 text-center">
              <p className="text-sm text-muted-foreground">用时</p>
              <p className="font-mono text-2xl font-bold">{formatTime(elapsed)}</p>
            </div>
            <div className="rounded-lg border border-border p-4 text-center">
              <p className="text-sm text-muted-foreground">句子数</p>
              <p className="font-mono text-2xl font-bold">{sentences.length}</p>
            </div>
            <div className="rounded-lg border border-border p-4 text-center">
              <p className="text-sm text-muted-foreground">速度</p>
              <p className="font-mono text-2xl font-bold">
                {wpm}
                {' '}
                WPM
              </p>
            </div>
            <div className="rounded-lg border border-border p-4 text-center">
              <p className="text-sm text-muted-foreground">正确率</p>
              <p className="font-mono text-2xl font-bold">
                {accuracy}
                %
              </p>
            </div>
          </div>

          {/* 错误句子 */}
          {errorList.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                错误句子（
                {errorList.length}
                ）
              </h3>
              <div className="space-y-2">
                {errorList.map(err => (
                  <div key={err.sentence} className="flex items-center justify-between rounded border border-border p-2 text-sm">
                    <span className="font-medium truncate max-w-[60%]">{err.sentence}</span>
                    <span className="text-red-500 truncate max-w-[35%]">
                      →
                      {' '}
                      {err.typed}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="space-y-3">
            <div className="flex gap-3">
              <Button className="flex-1" onClick={goToNextUnit} disabled={loading}>
                {loading ? '加载中...' : '下一章节'}
              </Button>
              <Button className="flex-1" variant="outline" onClick={startDictation}>
                开始默写
              </Button>
            </div>
            <div className="flex gap-3">
              <Button className="flex-1" variant="outline" onClick={restartWithSameSentences}>
                重新学习
              </Button>
              <Button className="flex-1" variant="outline" onClick={resetToGallery}>
                返回选择
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
