import type { WordWithSentences } from '@wordbook/interfaces'
import type { WordbookTextbook } from '@/database/schema'

import correctAudio from '@wordbook/assets/audio/correct.wav'
import incorrectAudio from '@wordbook/assets/audio/incorrect.wav'
import keydownAudio from '@wordbook/assets/audio/keydown.wav'
import { apiRequest } from '@wordbook/lib/request'
import { cancelSpeech, speakWord } from '@wordbook/lib/tts'
import { Icon } from '@iconify/react'
import { useStore } from '@nanostores/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import * as AppStore from '@/stores/app.store'

type Phase = 'selecting' | 'learning' | 'finished'

interface ErrorRecord {
  word: string
  typed: string
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

export function WordLearner() {
  // === 主题 ===
  const theme = useStore(AppStore.theme)

  // === 选择阶段状态 ===
  const [textbooks, setTextbooks] = useState<WordbookTextbook[]>([])
  const [unitNumbers, setUnitNumbers] = useState<number[]>([])
  const [textbookId, setTextbookId] = useState<number | null>(null)
  const [unitNumber, setUnitNumber] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  // === 学习阶段状态 ===
  const [phase, setPhase] = useState<Phase>('selecting')
  const [words, setWords] = useState<WordWithSentences[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [inputStatus, setInputStatus] = useState<('idle' | 'correct' | 'wrong')[]>([])
  const [typedChars, setTypedChars] = useState<string[]>([])
  const [wrongFlash, setWrongFlash] = useState(false)

  // === 功能条状态 ===
  const [accent, setAccent] = useState<'en-US' | 'en-GB'>('en-US')
  const [dictationMode, setDictationMode] = useState(false)
  const [hideMeaning, setHideMeaning] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)

  // === 统计 ===
  const [elapsed, setElapsed] = useState(0)
  const [totalInputs, setTotalInputs] = useState(0)
  const [correctInputs, setCorrectInputs] = useState(0)
  const [correctWords, setCorrectWords] = useState(0)
  const [errors, setErrors] = useState<Map<string, ErrorRecord>>(() => new Map())

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const wordCompleteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())
  const currentWordTypedRef = useRef('')
  const correctSoundRef = useRef<HTMLAudioElement | null>(null)
  const incorrectSoundRef = useRef<HTMLAudioElement | null>(null)
  const keydownSoundRef = useRef<HTMLAudioElement | null>(null)

  const resetToSelecting = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (wordCompleteTimeoutRef.current) {
      clearTimeout(wordCompleteTimeoutRef.current)
      wordCompleteTimeoutRef.current = null
    }
    cancelSpeech()
    setPhase('selecting')
    setWords([])
    setCurrentIndex(0)
    setCharIndex(0)
    setElapsed(0)
  }, [])

  const goToNextWord = useCallback(() => {
    wordCompleteTimeoutRef.current = null
    setCurrentIndex((prevIndex) => {
      const nextIndex = prevIndex + 1
      if (nextIndex >= words.length) {
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
        cancelSpeech()
        setPhase('finished')
        return prevIndex
      }
      const nextWord = words[nextIndex]
      const firstCharIdx = skipSpaces(nextWord.word, 0)
      setCharIndex(firstCharIdx)
      setInputStatus(nextWord.word.split('').map(ch => ch === ' ' ? 'correct' : 'idle') as ('idle' | 'correct' | 'wrong')[])
      setTypedChars(nextWord.word.split('').map(ch => ch === ' ' ? ' ' : ''))
      currentWordTypedRef.current = ''
      return nextIndex
    })
  }, [words])

  // === 加载课本列表 ===
  useEffect(() => {
    apiRequest<WordbookTextbook[]>('/wordbook/api/textbooks').then(setTextbooks)
  }, [])

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
    if (phase === 'learning' && autoSpeak && words[currentIndex]) {
      const timer = setTimeout(() => {
        speakWord(words[currentIndex].word, accent)
      }, 100)
      return () => clearTimeout(timer)
    }
    return () => cancelSpeech()
  }, [currentIndex, phase, words, autoSpeak, accent])

  // === 全局键盘监听 ===
  useEffect(() => {
    if (phase !== 'learning')
      return

    const pendingTimeouts = pendingTimeoutsRef.current

    const handleKeyDown = (e: KeyboardEvent) => {
      // Esc 返回选择
      if (e.key === 'Escape') {
        resetToSelecting()
        return
      }

      // 忽略功能键
      if (e.key.length > 1 && e.key !== 'Backspace')
        return

      const word = words[currentIndex]
      if (!word)
        return

      if (e.key === 'Backspace') {
        if (charIndex > 0) {
          let newIdx = charIndex - 1
          // 跳过空格位置
          while (newIdx > 0 && word.word[newIdx] === ' ') {
            newIdx--
          }
          // 如果当前位置是空格，不处理
          if (word.word[newIdx] === ' ')
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
          currentWordTypedRef.current = currentWordTypedRef.current.slice(0, -1)
        }
        return
      }

      // 字母输入
      const expected = word.word[charIndex]
      if (expected === undefined)
        return

      // 如果当前位置是空格，自动跳过（理论上不会发生，因为初始化时已跳过）
      if (expected === ' ') {
        setCharIndex(skipSpaces(word.word, charIndex))
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
        currentWordTypedRef.current += e.key

        const nextCharIndex = skipSpaces(word.word, charIndex + 1)
        if (nextCharIndex >= word.word.length) {
          // 单词完成
          setCorrectWords(c => c + 1)
          if (soundEnabled)
            playSound(correctSoundRef.current)
          if (wordCompleteTimeoutRef.current)
            clearTimeout(wordCompleteTimeoutRef.current)
          wordCompleteTimeoutRef.current = setTimeout(goToNextWord, 500)
        }
        setCharIndex(nextCharIndex)
      }
      else {
        // 错误
        if (soundEnabled)
          playSound(incorrectSoundRef.current)
        setWrongFlash(true)
        const flashTimeoutId = setTimeout(setWrongFlash, 300, false)
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
        currentWordTypedRef.current += e.key

        // 记录错误
        if (!errors.has(word.word)) {
          setErrors((prev) => {
            const next = new Map(prev)
            next.set(word.word, { word: word.word, typed: currentWordTypedRef.current })
            return next
          })
        }
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
  }, [phase, currentIndex, charIndex, words, errors, soundEnabled, resetToSelecting, goToNextWord])

  const handleTextbookChange = async (value: string) => {
    const id = Number(value)
    setTextbookId(id)
    setUnitNumber(null)
    setUnitNumbers([])
    const units = await apiRequest<number[]>(`/wordbook/api/units?textbookId=${id}`)
    setUnitNumbers(units)
  }

  const startLearning = async () => {
    if (!textbookId || unitNumber === null)
      return
    setLoading(true)
    try {
      const data = await apiRequest<WordWithSentences[]>(
        `/wordbook/api/words?textbookId=${textbookId}&unitNumber=${unitNumber}`,
      )
      if (data.length === 0) {
        alert('该单元暂无单词')
        return
      }
      const shuffled = shuffle(data)
      const firstWord = shuffled[0]
      const firstCharIdx = skipSpaces(firstWord.word, 0)
      setWords(shuffled)
      setCurrentIndex(0)
      setCharIndex(firstCharIdx)
      setInputStatus(firstWord.word.split('').map(ch => ch === ' ' ? 'correct' : 'idle') as ('idle' | 'correct' | 'wrong')[])
      setTypedChars(firstWord.word.split('').map(ch => ch === ' ' ? ' ' : ''))
      setElapsed(0)
      setTotalInputs(0)
      setCorrectInputs(0)
      setCorrectWords(0)
      setErrors(new Map())
      currentWordTypedRef.current = ''
      setPhase('learning')
    }
    finally {
      setLoading(false)
    }
  }

  const restartWithSameWords = () => {
    const shuffled = shuffle(words)
    const firstWord = shuffled[0]
    const firstCharIdx = skipSpaces(firstWord.word, 0)
    setWords(shuffled)
    setCurrentIndex(0)
    setCharIndex(firstCharIdx)
    setInputStatus(firstWord.word.split('').map(ch => ch === ' ' ? 'correct' : 'idle') as ('idle' | 'correct' | 'wrong')[])
    setTypedChars(firstWord.word.split('').map(ch => ch === ' ' ? ' ' : ''))
    setElapsed(0)
    setTotalInputs(0)
    setCorrectInputs(0)
    setCorrectWords(0)
    setErrors(new Map())
    currentWordTypedRef.current = ''
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
    setUnitNumber(nextUnit)
    setLoading(true)
    try {
      const data = await apiRequest<WordWithSentences[]>(
        `/wordbook/api/words?textbookId=${textbookId}&unitNumber=${nextUnit}`,
      )
      if (data.length === 0) {
        alert('该单元暂无单词')
        return
      }
      const shuffled = shuffle(data)
      const firstWord = shuffled[0]
      const firstCharIdx = skipSpaces(firstWord.word, 0)
      setWords(shuffled)
      setCurrentIndex(0)
      setCharIndex(firstCharIdx)
      setInputStatus(firstWord.word.split('').map(ch => ch === ' ' ? 'correct' : 'idle') as ('idle' | 'correct' | 'wrong')[])
      setTypedChars(firstWord.word.split('').map(ch => ch === ' ' ? ' ' : ''))
      setElapsed(0)
      setTotalInputs(0)
      setCorrectInputs(0)
      setCorrectWords(0)
      setErrors(new Map())
      currentWordTypedRef.current = ''
      setPhase('learning')
    }
    finally {
      setLoading(false)
    }
  }, [textbookId, unitNumber, unitNumbers])

  const startDictation = useCallback(() => {
    setDictationMode(true)
    const shuffled = shuffle(words)
    const firstWord = shuffled[0]
    const firstCharIdx = skipSpaces(firstWord.word, 0)
    setWords(shuffled)
    setCurrentIndex(0)
    setCharIndex(firstCharIdx)
    setInputStatus(firstWord.word.split('').map(ch => ch === ' ' ? 'correct' : 'idle') as ('idle' | 'correct' | 'wrong')[])
    setTypedChars(firstWord.word.split('').map(ch => ch === ' ' ? ' ' : ''))
    setElapsed(0)
    setTotalInputs(0)
    setCorrectInputs(0)
    setCorrectWords(0)
    setErrors(new Map())
    currentWordTypedRef.current = ''
    setPhase('learning')
  }, [words])

  const wpm = elapsed > 0 ? (correctWords / (elapsed / 60)).toFixed(1) : '0.0'
  const accuracy = totalInputs > 0 ? ((correctInputs / totalInputs) * 100).toFixed(1) : '100.0'
  const selectedTextbook = textbooks.find(tb => tb.id === textbookId)

  // === 选择阶段 ===
  if (phase === 'selecting') {
    return (
      <div className="flex h-full items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>选择学习内容</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">课本</label>
              <Select value={textbookId ? String(textbookId) : ''} onValueChange={handleTextbookChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择课本" />
                </SelectTrigger>
                <SelectContent>
                  {textbooks.map(tb => (
                    <SelectItem key={tb.id} value={String(tb.id)}>
                      {`${tb.stage} · ${tb.publisher} · ${tb.name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">单元</label>
              <Select
                value={unitNumber !== null ? String(unitNumber) : ''}
                onValueChange={v => setUnitNumber(Number(v))}
                disabled={!textbookId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={textbookId ? '选择单元' : '请先选择课本'} />
                </SelectTrigger>
                <SelectContent>
                  {unitNumbers.map(n => (
                    <SelectItem key={n} value={String(n)}>
                      {n === 0 ? '无单元' : `Unit ${n}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {unitNumbers.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  已有单元：
                  {unitNumbers.join('、')}
                </p>
              )}
            </div>

            <Button
              className="w-full"
              onClick={startLearning}
              disabled={!textbookId || unitNumber === null || loading}
            >
              {loading ? '加载中...' : '开始学习'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // === 学习阶段 ===
  if (phase === 'learning') {
    const currentWord = words[currentIndex]
    const progress = ((currentIndex + 1) / words.length) * 100

    return (
      <div
        className={`flex h-full flex-col bg-background transition-colors ${wrongFlash ? 'bg-red-50 dark:bg-red-950/30' : ''}`}
      >
        {/* 功能条 */}
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <div className="flex items-center gap-4">
            {/* 课本信息 */}
            <span className="text-sm text-muted-foreground">
              {selectedTextbook && `${selectedTextbook.stage} · ${selectedTextbook.publisher} · ${selectedTextbook.name}`}
              {' '}
              {unitNumber !== null && `Unit ${unitNumber}`}
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

            {/* 隐藏释义 */}
            <label className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground">
              <Switch
                size="sm"
                checked={hideMeaning}
                onCheckedChange={setHideMeaning}
              />
              <span>释义</span>
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
            <Button variant="ghost" size="sm" onClick={resetToSelecting}>
              Esc 返回
            </Button>
          </div>
        </div>

        {/* 主内容区 - 居中显示 */}
        <div className="flex flex-1 flex-col items-center justify-center">
          {/* 单词显示 */}
          <div className="mb-8 text-center">
            <div className="mb-4 font-mono text-7xl font-bold tracking-widest">
              {currentWord.word.split('').map((ch, i) => {
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
            {!hideMeaning && (
              <p className="text-2xl text-muted-foreground">{currentWord.meaning}</p>
            )}
          </div>

          {/* 进度条 */}
          <div className="w-full max-w-lg px-6">
            <Progress value={progress} className="mb-2 h-1.5" />
            <p className="text-center text-sm text-muted-foreground">
              {currentIndex + 1}
              {' / '}
              {words.length}
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
              <p className="font-mono text-lg font-semibold">{correctWords}</p>
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
              <p className="text-sm text-muted-foreground">单词数</p>
              <p className="font-mono text-2xl font-bold">{words.length}</p>
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

          {/* 错误单词 */}
          {errorList.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                错误单词（
                {errorList.length}
                ）
              </h3>
              <div className="space-y-2">
                {errorList.map(err => (
                  <div key={err.word} className="flex items-center justify-between rounded border border-border p-2 text-sm">
                    <span className="font-medium">{err.word}</span>
                    <span className="text-red-500">
                      → 你输入:
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
              <Button className="flex-1" variant="outline" onClick={restartWithSameWords}>
                重新学习
              </Button>
              <Button className="flex-1" variant="outline" onClick={resetToSelecting}>
                返回选择
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
