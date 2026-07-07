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

type PracticeType = 'word' | 'char' | 'all' | 'text'

interface WordTyperProps {
  lessonId: number
  type: PracticeType
}

interface LessonTextItem {
  category: 'passage' | 'poem' | 'idiom'
  title: string | null
  author: string | null
  dynasty: string | null
  content: string
}

interface LessonContent {
  yilei: { char: string, pinyin: string | null }[]
  erlei: { char: string, pinyin: string | null }[]
  words: string[]
  texts: LessonTextItem[]
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

/**
 * 按子句切分（逗号/分号），保留结尾标点
 * "一道残阳铺水中，半江瑟瑟半江红。" → ["一道残阳铺水中，", "半江瑟瑟半江红。"]
 */
function splitSubclause(text: string): string[] {
  const out: string[] = []
  let cur = ''
  for (const ch of text) {
    cur += ch
    if (/[，；,;]/.test(ch)) {
      const s = cur.trim()
      if (s)
        out.push(s)
      cur = ''
    }
  }
  const rest = cur.trim()
  if (rest)
    out.push(rest)
  return out
}

/**
 * 从内容中剥离引用出处（——后的部分）
 * "自用则小。——《尚书》" → { body: "自用则小。", source: "《尚书》" }
 * "好问则裕，"（无出处）→ { body: "好问则裕，", source: null }
 */
function extractSource(content: string): { body: string, source: string | null } {
  // 排除 em dash 字符避免回溯，body 部分不含 ——
  const m = content.match(/^([^—]+)——(.+)$/)
  return m ? { body: m[1], source: m[2] } : { body: content, source: null }
}

/**
 * 把一条课文文本（passage/poem/idiom）切分为多个 TypingItem
 * - 古诗：按 \n 分行后再按逗号切，每子句填 meta（标题/朝代/作者）作 display 上方提示
 * - 散文/成语：直接按逗号切子句
 * - 含 —— 出处的成语：出处剥离到 meta.source，不参与打字
 * 顺序保持原文顺序（由调用方保证 shuffle=false）
 */
function textToItems(it: LessonTextItem): TypingItem[] {
  const meta: TypingItem['meta'] = it.title
    ? { title: it.title ?? undefined, dynasty: it.dynasty ?? undefined, author: it.author ?? undefined }
    : undefined

  const lines = it.category === 'poem' ? it.content.split('\n') : [it.content]
  const items: TypingItem[] = []
  for (const line of lines) {
    for (const sub of splitSubclause(line)) {
      // 剥离引用出处（——《XXX》/——[X]XXX），出处进 meta.source
      const { body, source } = extractSource(sub)
      const pinyin = getWordPinyin(body)
      const target = toPinyinTarget(pinyin)
      if (!target)
        continue
      const itemMeta = source ? { ...meta, source } : meta
      items.push({ display: body, pinyin, target, category: it.category, meta: itemMeta })
    }
  }
  return items
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

/**
 * 逐字渲染 display 内容：汉字正常 inline-block，标点弱化（opacity-40）
 * - 句末标点（在最后一个汉字之后）：w-0 + translateX 不占布局位置，与拼音行对齐
 * - 句中标点（在汉字之间）：保持正常占位避免与后续汉字重叠
 */
function renderDisplayChars(display: string) {
  const chars = Array.from(display)
  const lastHanIdx = chars.reduce((last, ch, i) =>
    /[\u4E00-\u9FFF]/.test(ch) ? i : last, -1)
  return chars.map((ch, i) => {
    if (/[\u4E00-\u9FFF]/.test(ch)) {
      // eslint-disable-next-line react/no-array-index-key -- 字符位置稳定，display 内容不可变
      return <span key={i} className="inline-block">{ch}</span>
    }
    // 标点：句末（最后一个汉字之后）用 w-0 不占位，句中保持占位
    const isTrailing = i > lastHanIdx
    if (isTrailing) {
      return (
        <span
          // eslint-disable-next-line react/no-array-index-key -- 句末标点位置稳定
          key={i}
          className="inline-block w-0 overflow-visible opacity-40"
          style={{ transform: 'translateX(0.3em)' }}
        >
          {ch}
        </span>
      )
    }
    // eslint-disable-next-line react/no-array-index-key -- 句中标点位置稳定
    return <span key={i} className="inline-block opacity-40">{ch}</span>
  })
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
    if (type === 'text') {
      // 课文：按原文顺序切子句，meta 承载古诗题作者
      for (const t of content.texts)
        list.push(...textToItems(t))
    }
    else {
      if (type === 'word' || type === 'all')
        list.push(...content.words.map(wordToItem))
      if (type === 'char' || type === 'all') {
        list.push(...content.yilei.map(c => charToItem(c, 'one')))
        list.push(...content.erlei.map(c => charToItem(c, 'two')))
      }
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
    // 课文按原文顺序练习（保阅读逻辑），字/词打乱巩固记忆
    shuffle: type !== 'text',
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
    const typeLabel = type === 'word' ? '词语' : type === 'char' ? '生字' : type === 'text' ? '课文' : '全部'
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

  // 字号：课文（type='text'）统一固定字号避免跳变；字/词保持大号聚焦
  const displaySizeClass = type === 'text'
    ? 'text-5xl tracking-wide'
    : 'text-7xl tracking-widest'
  const pinyinSizeClass = type === 'text' ? 'text-4xl' : 'text-5xl'
  const pinyinHintSizeClass = type === 'text' ? 'text-xl' : 'text-2xl'

  return (
    <div className={`relative flex h-full flex-col bg-background transition-colors ${engine.wrongFlash ? 'bg-red-50 dark:bg-red-950/30' : ''}`}>
      {!engine.started && <StartOverlay />}

      {/* 功能条 */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="text-sm text-muted-foreground">
          {type === 'word' ? '词语练习' : type === 'char' ? '生字练习' : type === 'text' ? '课文练习' : '综合练习'}
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
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        {cur && (
          <div className="mb-8 max-w-5xl text-center">
            {/* meta 提示（古诗题/作者 或 成语出处，不参与打字） */}
            {cur.meta?.title && (
              <p className="mb-3 text-sm text-muted-foreground">
                《
                {cur.meta.title}
                》
                {cur.meta.dynasty ?? ''}
                ·
                {cur.meta.author ?? ''}
              </p>
            )}
            {cur.meta?.source && (
              <p className="mb-3 text-sm text-muted-foreground">
                ——
                {cur.meta.source}
              </p>
            )}
            {/* 带调拼音提示（教材式注音，置于汉字上方） */}
            {showPinyinHint && (
              <p className={`mb-3 ${pinyinHintSizeClass} ${pinyinHintClass}`}>
                {cur.pinyin}
              </p>
            )}
            {/* 中文展示 */}
            <div className={`mb-6 font-medium text-foreground ${displaySizeClass}`}>
              {type === 'text'
                ? (
                  // 课文模式：逐字渲染，标点弱化且句末标点不占位
                    renderDisplayChars(cur.display)
                  )
                : cur.display}
            </div>
            {/* 拼音打字进度：按音节分组，默写模式下划线遮蔽 */}
            <div className={`font-mono ${pinyinSizeClass} font-bold leading-relaxed tracking-[0.1em]`}>
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
