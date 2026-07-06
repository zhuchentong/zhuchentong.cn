import type { TypingItem } from '@chinese/composables/useTypingEngine'
import { formatTime, useTypingEngine } from '@chinese/composables/useTypingEngine'
import { getCharPinyin, getWordPinyin, toPinyinTarget } from '@chinese/lib/pinyin'
import { apiRequest } from '@chinese/lib/request'
import { cancelSpeech, speakWord } from '@chinese/lib/tts'
import correctAudio from '@english/assets/audio/correct.wav'
import incorrectAudio from '@english/assets/audio/incorrect.wav'
import keydownAudio from '@english/assets/audio/keydown.wav'
import { Icon } from '@iconify/react'
import { useStore } from '@nanostores/react'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import * as AppStore from '@/stores/app.store'

type PracticeType = 'word' | 'char' | 'all'

interface WordTyperProps {
  lessonId: number
  type: PracticeType
}

interface LessonContent {
  yilei: { char: string, pinyin: string | null }[]
  erlei: { char: string, pinyin: string | null }[]
  words: string[]
}

/** 「按任意键开始」半透明遮罩 */
function StartOverlay() {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-xs">
      <div className="flex flex-col items-center gap-3">
        <Icon icon="icon-park-outline:keyboard-one" className="size-12 text-muted-foreground" />
        <p className="animate-pulse text-xl font-medium text-foreground">按任意键开始</p>
      </div>
    </div>
  )
}

/** 把单个生字转成 TypingItem（拼音取 DB → cnchar 兜底） */
function charToItem(c: { char: string, pinyin: string | null }, category: string): TypingItem {
  const pinyin = c.pinyin ?? getCharPinyin(c.char)
  return {
    display: c.char,
    pinyin: pinyin || getCharPinyin(c.char),
    target: toPinyinTarget(pinyin || getCharPinyin(c.char)),
    category,
  }
}

/** 把词语转成 TypingItem（DB 无拼音，统一 cnchar） */
function wordToItem(word: string): TypingItem {
  const pinyin = getWordPinyin(word)
  return { display: word, pinyin, target: toPinyinTarget(pinyin), category: 'word' }
}

/** 打字区单个字符 token：ch=去调字母，idx=扁平索引(对齐 inputStatus)，gapBefore=音节首字母前需间隔 */
interface RenderToken {
  ch: string
  idx: number
  gapBefore: boolean
}

/**
 * 把带调拼音按音节切分为渲染 token，扁平 idx 与引擎的 target/inputStatus 对齐
 * "yóu rú" → [{you,0,?},{ru,3,gap}]，音节间由 gapBefore 触发视觉间隔
 */
function buildSyllableTokens(pinyin: string): RenderToken[] {
  const out: RenderToken[] = []
  let idx = 0
  pinyin.split(/\s+/).filter(Boolean).map(toPinyinTarget).forEach((syl, sylIdx) => {
    Array.from(syl).forEach((ch, ci) => {
      out.push({ ch, idx, gapBefore: sylIdx > 0 && ci === 0 })
      idx++
    })
  })
  return out
}

export function WordTyper({ lessonId, type }: WordTyperProps) {
  const theme = useStore(AppStore.theme)

  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState<LessonContent | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [hidePinyin, setHidePinyin] = useState(false)

  // 按 type 构造 TypingItem[]，content 不变时引用稳定
  const items = useMemo<TypingItem[]>(() => {
    if (!content)
      return []
    const list: TypingItem[] = []
    if (type === 'word' || type === 'all')
      list.push(...content.words.map(wordToItem))
    if (type === 'char' || type === 'all') {
      list.push(...content.yilei.map(c => charToItem(c, 'one')))
      list.push(...content.erlei.map(c => charToItem(c, 'two')))
    }
    // 过滤掉无有效拼音的条目（cnchar 查不到的生僻字）
    return list.filter(it => it.target.length > 0)
  }, [content, type])

  const onSpeak = useCallback((item: TypingItem) => speakWord(item.display, 'zh-CN'), [])
  const onExit = useCallback(() => {
    cancelSpeech()
    window.location.href = '/chinese/gallery'
  }, [])

  const engine = useTypingEngine({
    items,
    soundEnabled,
    autoSpeak,
    audio: { correct: correctAudio, incorrect: incorrectAudio, keydown: keydownAudio },
    onSpeak,
    onExit,
  })

  // 卸载取消朗读
  useEffect(() => () => cancelSpeech(), [])

  // 加载课文内容
  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiRequest<LessonContent>(`/chinese/api/content?lessonId=${lessonId}`)
        setContent(data)
      }
      catch (err) {
        console.error('加载课文内容失败:', err)
        alert('加载失败，请重试')
        window.location.href = '/chinese/gallery'
      }
      finally {
        setLoading(false)
      }
    }
    load()
  }, [lessonId])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-background">
        <Icon icon="icon-park-outline:empty" className="size-10 text-muted-foreground" />
        <p className="text-muted-foreground">该课文暂无练习内容</p>
        <Button variant="outline" size="sm" onClick={onExit}>返回选择</Button>
      </div>
    )
  }

  // === 完成阶段 ===
  if (engine.phase === 'finished') {
    const errorList = Array.from(engine.errors)
    const typeLabel = type === 'word' ? '词语' : type === 'char' ? '生字' : '全部'
    return (
      <div className="flex h-full items-center justify-center bg-background p-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-center text-2xl">练习完成！</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border p-4 text-center">
                <p className="text-sm text-muted-foreground">用时</p>
                <p className="font-mono text-2xl font-bold">{formatTime(engine.elapsed)}</p>
              </div>
              <div className="rounded-lg border border-border p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  {typeLabel}
                  数
                </p>
                <p className="font-mono text-2xl font-bold">{engine.items.length}</p>
              </div>
              <div className="rounded-lg border border-border p-4 text-center">
                <p className="text-sm text-muted-foreground">速度（个/分）</p>
                <p className="font-mono text-2xl font-bold">{engine.wpm}</p>
              </div>
              <div className="rounded-lg border border-border p-4 text-center">
                <p className="text-sm text-muted-foreground">正确率</p>
                <p className="font-mono text-2xl font-bold">
                  {engine.accuracy}
                  %
                </p>
              </div>
            </div>

            {errorList.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                  错误（
                  {errorList.length}
                  ）
                </h3>
                <div className="flex flex-wrap gap-2">
                  {errorList.map(w => (
                    <span key={w} className="rounded border border-border px-2 py-1 text-sm font-medium">
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button className="flex-1" onClick={engine.restart}>重新练习</Button>
              <Button className="flex-1" variant="outline" onClick={onExit}>返回选择</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // === 学习阶段 ===
  const cur = engine.current
  const tokens: RenderToken[] = cur ? buildSyllableTokens(cur.pinyin) : []
  const showPinyinHint = !hidePinyin || engine.showAnswer
  const pinyinHintClass = engine.showAnswer ? 'text-amber-500' : 'text-muted-foreground'

  return (
    <div className={`relative flex h-full flex-col bg-background transition-colors ${engine.wrongFlash ? 'bg-red-50 dark:bg-red-950/30' : ''}`}>
      {!engine.started && <StartOverlay />}

      {/* 功能条 */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="text-sm text-muted-foreground">
          {type === 'word' ? '词语练习' : type === 'char' ? '生字练习' : '综合练习'}
        </span>
        <div className="flex items-center gap-3">
          {/* 默写模式：隐藏拼音提示，显示「答案」按钮 */}
          {hidePinyin && (
            <button
              type="button"
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-sm hover:bg-accent hover:text-accent-foreground ${engine.showAnswer ? 'text-amber-500' : 'text-muted-foreground'}`}
              onClick={() => engine.setShowAnswer(true)}
            >
              <Icon icon="icon-park-outline:preview-open" className="size-4" />
              <span>答案</span>
            </button>
          )}
          <div className="h-4 w-px bg-border" />

          <label className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground">
            <Switch size="sm" checked={hidePinyin} onCheckedChange={setHidePinyin} />
            <span>默写</span>
          </label>

          <div className="h-4 w-px bg-border" />

          <button
            className="flex items-center rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={() => AppStore.updateTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Icon icon={theme === 'dark' ? 'icon-park-outline:moon' : 'icon-park-outline:sun-one'} className="size-4" />
          </button>
          <div className="h-4 w-px bg-border" />

          <label className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground">
            <Switch size="sm" checked={autoSpeak} onCheckedChange={setAutoSpeak} />
            <Icon icon="icon-park-outline:volume-small" className="size-4" />
          </label>
          <label className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground">
            <Switch size="sm" checked={soundEnabled} onCheckedChange={setSoundEnabled} />
            <Icon icon="icon-park-outline:keyboard-one" className="size-4" />
          </label>

          <Button variant="ghost" size="sm" onClick={onExit}>Esc 返回</Button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex flex-1 flex-col items-center justify-center">
        {cur && (
          <div className="mb-8 text-center">
            {/* 带调拼音提示（教材式注音，置于汉字上方） */}
            {showPinyinHint && (
              <p className={`mb-3 text-2xl ${pinyinHintClass}`}>
                {cur.pinyin}
              </p>
            )}
            {/* 中文展示 */}
            <div className="mb-6 font-medium text-7xl tracking-widest text-foreground">
              {cur.display}
            </div>
            {/* 拼音打字进度：按音节分组，默写模式下划线遮蔽 */}
            <div className="font-mono text-5xl font-bold tracking-[0.15em]">
              {tokens.map((t) => {
                const status = engine.inputStatus[t.idx]
                const isCurrent = t.idx === engine.charIndex
                let char = t.ch
                let color = 'text-muted-foreground/40'
                if (engine.showAnswer) {
                  // 默写 + 答案：全部揭示为琥珀色
                  color = 'text-amber-500'
                }
                else if (hidePinyin) {
                  // 默写模式：未输入用下划线，正确才揭示字母
                  if (status === 'correct') {
                    char = t.ch
                    color = 'text-green-500'
                  }
                  else if (status === 'wrong') {
                    char = '_'
                    color = 'text-red-500'
                  }
                  else {
                    char = '_'
                    color = isCurrent ? 'text-foreground' : 'text-muted-foreground/40'
                  }
                }
                else {
                  // 正常模式：显示字母
                  if (status === 'correct')
                    color = 'text-green-500'
                  else if (status === 'wrong')
                    color = 'text-red-500'
                  else if (isCurrent)
                    color = 'text-foreground'
                }
                return (
                  <Fragment key={t.idx}>
                    {t.gapBefore && <span className="inline-block w-[0.4em]" />}
                    <span className={`${color} inline-block transition-colors`}>{char}</span>
                  </Fragment>
                )
              })}
            </div>
          </div>
        )}

        {/* 进度条 */}
        <div className="w-full max-w-lg px-6">
          <Progress value={engine.progress} className="mb-2 h-1.5" />
          <p className="text-center text-sm text-muted-foreground">
            {engine.currentIndex + 1}
            {' / '}
            {engine.items.length}
          </p>
        </div>
      </div>

      {/* 底部统计栏 */}
      <div className="border-t border-border bg-card px-6 py-4">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">用时</p>
            <p className="font-mono text-lg font-semibold">{formatTime(engine.elapsed)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">速度</p>
            <p className="font-mono text-lg font-semibold">
              {engine.wpm}
              <span className="ml-1 text-xs font-normal">个/分</span>
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">正确数</p>
            <p className="font-mono text-lg font-semibold">{engine.correctItems}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">正确率</p>
            <p className="font-mono text-lg font-semibold">
              {engine.accuracy}
              <span className="ml-0.5 text-xs font-normal">%</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
