import type { Margin } from '../interfaces'
import { useStore } from '@nanostores/react'
import { useEffect, useMemo, useState } from 'react'
import FontPickerDialog from '@/components/FontPickerDialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldContent, FieldGroup, FieldLabel, FieldSeparator, FieldSet } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { FONT_FAMILIES } from '@/config/font.config'
import { countMatches, generateQuiz } from '../composables/useQuizGenerator'
import { COLOR_PALETTE, DEFAULT_MARGIN, DEFAULT_PINYIN_CONFIG, FINAL_GROUPS, INITIAL_GROUPS } from '../config'
import {
  pinyinAnswerColor,
  pinyinAnswerMode,
  pinyinFontColor,
  pinyinFontFamily,
  pinyinFontSize,
  pinyinFontWeight,
  pinyinGridSize,
  pinyinHighlightColor,
  pinyinHighlightEnabled,
  pinyinLineColor,
  pinyinMargin,
  pinyinQuestionCount,
  pinyinQuestionGap,
  pinyinQuestions,
  pinyinSeed,
  pinyinSelectedFinals,
  pinyinSelectedInitials,
} from '../store'
import ExportButton from './ExportButton'

const groupCls = 'bg-background rounded-md border px-3 py-[2px] shadow-xs'
const sepCls = 'h-px my-0'

function ColorPickerDialog({ open, onOpenChange, color, onSelect }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  color: string
  onSelect: (color: string) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[320px]">
        <DialogHeader>
          <DialogTitle>选择颜色</DialogTitle>
          <DialogDescription className="sr-only">选择颜色</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3">
          {COLOR_PALETTE.map(group => (
            <div key={group.name}>
              <div className="flex gap-2">
                {group.colors.map(c => (
                  <button
                    key={c}
                    className="border-2 rounded-md size-9 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c === 'black' ? '#000' : c,
                      borderColor: color === c ? 'hsl(var(--primary))' : 'transparent',
                    }}
                    onClick={() => {
                      onSelect(c)
                      onOpenChange(false)
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function MarginDialog({ open, onOpenChange, margin, onChange }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  margin: Margin
  onChange: (margin: Margin) => void
}) {
  const sides = [
    { key: 'top' as const, label: '上边距' },
    { key: 'right' as const, label: '右边距' },
    { key: 'bottom' as const, label: '下边距' },
    { key: 'left' as const, label: '左边距' },
  ]
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>页边距设置</DialogTitle>
          <DialogDescription className="sr-only">调整页边距大小</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {sides.map(item => (
            <div key={item.key} className="flex gap-3 items-center">
              <span className="text-sm text-muted-foreground w-16">{item.label}</span>
              <Slider
                value={[margin[item.key]]}
                min={10}
                max={100}
                step={1}
                className="flex-1"
                onValueChange={([v]) => onChange({ ...margin, [item.key]: v })}
              />
              <span className="text-sm text-muted-foreground text-right w-12">
                {margin[item.key]}
                mm
              </span>
            </div>
          ))}
        </div>
        <DialogFooter className="flex-row justify-between">
          <Button variant="ghost" size="sm" onClick={() => onChange({ ...DEFAULT_MARGIN })}>重置</Button>
          <Button onClick={() => onOpenChange(false)}>确定</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PinyinSelector({ selectedInitials, selectedFinals, onInitialsChange, onFinalsChange }: {
  selectedInitials: string[]
  selectedFinals: string[]
  onInitialsChange: (initials: string[]) => void
  onFinalsChange: (finals: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [localInitials, setLocalInitials] = useState(selectedInitials)
  const [localFinals, setLocalFinals] = useState(selectedFinals)

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (nextOpen) {
      setLocalInitials([...selectedInitials])
      setLocalFinals([...selectedFinals])
    }
  }

  const resolvedCount = useMemo(() =>
    countMatches(localInitials, localFinals), [localInitials, localFinals])

  function toggleItem(list: string[], item: string): string[] {
    return list.includes(item) ? list.filter(x => x !== item) : [...list, item]
  }

  function toggleGroup(list: string[], items: string[]): string[] {
    const allSelected = items.every(i => list.includes(i))
    return allSelected ? list.filter(x => !items.includes(x)) : [...new Set([...list, ...items])]
  }

  return (
    <>
      <button className="flex h-9 w-full items-center justify-between hover:bg-accent" onClick={() => handleOpenChange(true)}>
        <FieldLabel className="text-slate-700 dark:text-slate-200">已选拼音</FieldLabel>
        <span className="text-xs text-muted-foreground">
          {selectedInitials.length}
          声
          {selectedFinals.length}
          韵 →
          {countMatches(selectedInitials, selectedFinals)}
          音节
        </span>
      </button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[480px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>选择拼音</DialogTitle>
            <DialogDescription className="sr-only">选择要练习的声母和韵母</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] space-y-4">
            <div className="text-xs font-medium text-muted-foreground">韵母</div>
            {FINAL_GROUPS.map(group => (
              <div key={group.id}>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                  <span className="font-medium">{group.title}</span>
                  <button
                    className="text-primary hover:underline"
                    onClick={() => setLocalFinals(toggleGroup(localFinals, group.finals))}
                  >
                    {group.finals.every(f => localFinals.includes(f)) ? '取消全选' : '全选'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {group.finals.map(final => (
                    <button
                      key={final}
                      className={[
                        'px-3 py-1.5 text-sm rounded-md border transition-colors',
                        localFinals.includes(final)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground border-border hover:bg-accent',
                      ].join(' ')}
                      onClick={() => setLocalFinals(toggleItem(localFinals, final))}
                    >
                      {final}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="h-px bg-border my-2" />

            <div className="text-xs font-medium text-muted-foreground">声母</div>
            {INITIAL_GROUPS.map(group => (
              <div key={group.id}>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                  <span className="font-medium">{group.title}</span>
                  <button
                    className="text-primary hover:underline"
                    onClick={() => setLocalInitials(toggleGroup(localInitials, group.initials))}
                  >
                    {group.initials.every(i => localInitials.includes(i)) ? '取消全选' : '全选'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {group.initials.map(initial => (
                    <button
                      key={initial}
                      className={[
                        'px-3 py-1.5 text-sm rounded-md border transition-colors',
                        localInitials.includes(initial)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground border-border hover:bg-accent',
                      ].join(' ')}
                      onClick={() => setLocalInitials(toggleItem(localInitials, initial))}
                    >
                      {initial}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <span className="text-xs text-muted-foreground flex-1">
              已选
              {localInitials.length}
              个声母、
              {localFinals.length}
              个韵母，共
              {resolvedCount}
              个音节
            </span>
            <Button
              variant="outline"
              onClick={() => {
                const allInitials = INITIAL_GROUPS.flatMap(g => g.initials)
                const allFinals = FINAL_GROUPS.flatMap(g => g.finals)
                const shuffledI = [...allInitials].sort(() => Math.random() - 0.5)
                const shuffledF = [...allFinals].sort(() => Math.random() - 0.5)
                setLocalInitials(shuffledI.slice(0, 3))
                setLocalFinals(shuffledF.slice(0, 3))
              }}
            >
              随机
            </Button>
            <Button onClick={() => {
              onInitialsChange(localInitials)
              onFinalsChange(localFinals)
              setOpen(false)
            }}
            >
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function ControlPanel() {
  const selectedInitials = useStore(pinyinSelectedInitials)
  const selectedFinals = useStore(pinyinSelectedFinals)
  const questionCount = useStore(pinyinQuestionCount)
  const answerMode = useStore(pinyinAnswerMode)
  const highlightEnabled = useStore(pinyinHighlightEnabled)
  const gridSize = useStore(pinyinGridSize)
  const questionGap = useStore(pinyinQuestionGap)
  const margin = useStore(pinyinMargin)
  const lineColor = useStore(pinyinLineColor)
  const answerColor = useStore(pinyinAnswerColor)
  const fontSize = useStore(pinyinFontSize)
  const fontColor = useStore(pinyinFontColor)
  const fontFamily = useStore(pinyinFontFamily)
  const fontWeight = useStore(pinyinFontWeight)
  const highlightColor = useStore(pinyinHighlightColor)

  const [showFontDialog, setShowFontDialog] = useState(false)
  const [showMarginDialog, setShowMarginDialog] = useState(false)
  const [showLineColorPicker, setShowLineColorPicker] = useState(false)
  const [showAnswerColorPicker, setShowAnswerColorPicker] = useState(false)
  const [showFontColorPicker, setShowFontColorPicker] = useState(false)
  const [showHighlightColorPicker, setShowHighlightColorPicker] = useState(false)

  useEffect(() => {
    const seed = pinyinSeed.get()
    pinyinSeed.set(seed)
    pinyinQuestions.set(generateQuiz(selectedInitials, selectedFinals, seed, questionCount))
  }, [selectedInitials, selectedFinals, questionCount])

  function regenerate() {
    const newSeed = Date.now()
    pinyinSeed.set(newSeed)
    pinyinQuestions.set(generateQuiz(selectedInitials, selectedFinals, newSeed, questionCount))
  }

  function resetAll() {
    pinyinSelectedInitials.set([...DEFAULT_PINYIN_CONFIG.initials])
    pinyinSelectedFinals.set([...DEFAULT_PINYIN_CONFIG.finals])
    pinyinQuestionCount.set(DEFAULT_PINYIN_CONFIG.questionCount)
    pinyinAnswerMode.set(DEFAULT_PINYIN_CONFIG.answerMode)
    pinyinHighlightEnabled.set(DEFAULT_PINYIN_CONFIG.highlightEnabled)
    pinyinHighlightColor.set(DEFAULT_PINYIN_CONFIG.highlightColor)
    pinyinGridSize.set(DEFAULT_PINYIN_CONFIG.gridSize)
    pinyinQuestionGap.set(DEFAULT_PINYIN_CONFIG.questionGap)
    pinyinMargin.set({ ...DEFAULT_PINYIN_CONFIG.margin })
    pinyinLineColor.set(DEFAULT_PINYIN_CONFIG.lineColor)
    pinyinAnswerColor.set(DEFAULT_PINYIN_CONFIG.answerColor)
    pinyinFontSize.set(DEFAULT_PINYIN_CONFIG.fontSize)
    pinyinFontColor.set(DEFAULT_PINYIN_CONFIG.fontColor)
    pinyinFontFamily.set(DEFAULT_PINYIN_CONFIG.fontFamily)
    pinyinFontWeight.set(DEFAULT_PINYIN_CONFIG.fontWeight)
    const newSeed = Date.now()
    pinyinSeed.set(newSeed)
    pinyinQuestions.set(generateQuiz(DEFAULT_PINYIN_CONFIG.initials, DEFAULT_PINYIN_CONFIG.finals, newSeed, DEFAULT_PINYIN_CONFIG.questionCount))
  }

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={resetAll}>重置</Button>
        <ExportButton />
      </div>

      <Button variant="outline" onClick={regenerate}>重新出题</Button>

      <FieldSet className={groupCls}>
        <FieldGroup className="gap-0">
          <PinyinSelector
            selectedInitials={selectedInitials}
            selectedFinals={selectedFinals}
            onInitialsChange={v => pinyinSelectedInitials.set(v)}
            onFinalsChange={v => pinyinSelectedFinals.set(v)}
          />
          <FieldSeparator className={sepCls} />
          <Field orientation="horizontal" className="h-9 !items-center gap-6">
            <FieldLabel className="!flex-none w-14 shrink-0 text-slate-700 dark:text-slate-200">题目数量</FieldLabel>
            <FieldContent className="!flex-row items-center gap-2">
              <Slider className="flex-1" value={[questionCount]} min={1} max={60} step={1} onValueChange={([v]) => pinyinQuestionCount.set(v)} />
              <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">
                {questionCount}
                题
              </span>
            </FieldContent>
          </Field>
          <FieldSeparator className={sepCls} />
          <Field orientation="horizontal" className="h-9 !items-center gap-6">
            <FieldLabel className="!flex-none w-14 shrink-0 text-slate-700 dark:text-slate-200">答案模式</FieldLabel>
            <FieldContent className="flex-1">
              <Select value={answerMode} onValueChange={v => pinyinAnswerMode.set(v as 'all' | 'hide-keyword' | 'hidden')}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部显示</SelectItem>
                  <SelectItem value="hide-keyword">隐藏关键字</SelectItem>
                  <SelectItem value="hidden">全部隐藏</SelectItem>
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>
          <FieldSeparator className={sepCls} />
          <Field orientation="horizontal" className="h-9 items-center justify-between gap-6">
            <FieldLabel className="text-slate-700 dark:text-slate-200">关键字高亮</FieldLabel>
            <Switch checked={highlightEnabled} onCheckedChange={v => pinyinHighlightEnabled.set(v)} />
          </Field>
          {highlightEnabled && (
            <>
              <FieldSeparator className={sepCls} />
              <Field orientation="horizontal" className="h-9 items-center justify-between gap-6">
                <FieldLabel className="text-slate-700 dark:text-slate-200">关键字颜色</FieldLabel>
                <button
                  className="h-7 w-7 rounded-md border"
                  style={{ backgroundColor: highlightColor === 'black' ? '#000' : highlightColor }}
                  onClick={() => setShowHighlightColorPicker(true)}
                />
              </Field>
            </>
          )}
        </FieldGroup>
      </FieldSet>

      <FieldSet className={groupCls}>
        <FieldGroup className="gap-0">
          <Field orientation="horizontal" className="h-9 !items-center gap-6">
            <FieldLabel className="!flex-none w-14 shrink-0 text-slate-700 dark:text-slate-200">网格大小</FieldLabel>
            <FieldContent className="!flex-row items-center gap-2">
              <Slider className="flex-1" value={[gridSize]} min={6} max={60} step={1} onValueChange={([v]) => pinyinGridSize.set(v)} />
              <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">
                {gridSize}
                mm
              </span>
            </FieldContent>
          </Field>
          <FieldSeparator className={sepCls} />
          <Field orientation="horizontal" className="h-9 !items-center gap-6">
            <FieldLabel className="!flex-none w-14 shrink-0 text-slate-700 dark:text-slate-200">题目间隔</FieldLabel>
            <FieldContent className="!flex-row items-center gap-2">
              <Slider className="flex-1" value={[questionGap]} min={1} max={10} step={1} onValueChange={([v]) => pinyinQuestionGap.set(v)} />
              <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">
                {questionGap}
                格
              </span>
            </FieldContent>
          </Field>
          <FieldSeparator className={sepCls} />
          <button className="flex h-9 w-full items-center justify-between hover:bg-accent" onClick={() => setShowMarginDialog(true)}>
            <FieldLabel className="text-slate-700 dark:text-slate-200">页边距</FieldLabel>
            <span className="text-muted-foreground">
              {margin.top}
              ,
              {margin.right}
              ,
              {margin.bottom}
              ,
              {margin.left}
            </span>
          </button>
        </FieldGroup>
      </FieldSet>

      <FieldSet className={groupCls}>
        <FieldGroup className="gap-0">
          <Field orientation="horizontal" className="h-9 items-center justify-between gap-6">
            <FieldLabel className="text-slate-700 dark:text-slate-200">线条颜色</FieldLabel>
            <button
              className="h-7 w-7 rounded-md border"
              style={{ backgroundColor: lineColor === 'black' ? '#000' : lineColor }}
              onClick={() => setShowLineColorPicker(true)}
            />
          </Field>
          <FieldSeparator className={sepCls} />
          <Field orientation="horizontal" className="h-9 items-center justify-between gap-6">
            <FieldLabel className="text-slate-700 dark:text-slate-200">答案颜色</FieldLabel>
            <button
              className="h-7 w-7 rounded-md border"
              style={{ backgroundColor: answerColor === 'black' ? '#000' : answerColor }}
              onClick={() => setShowAnswerColorPicker(true)}
            />
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSet className={groupCls}>
        <FieldGroup className="gap-0">
          <button className="flex h-9 w-full items-center justify-between hover:bg-accent" onClick={() => setShowFontDialog(true)}>
            <FieldLabel className="text-slate-700 dark:text-slate-200">字体</FieldLabel>
            <span className="text-muted-foreground">
              {FONT_FAMILIES.find(f => f.id === fontFamily)?.label ?? fontFamily}
            </span>
          </button>
          <FieldSeparator className={sepCls} />
          <Field orientation="horizontal" className="h-9 items-center justify-between gap-6">
            <FieldLabel className="text-slate-700 dark:text-slate-200">字体加粗</FieldLabel>
            <Switch checked={fontWeight === 'bold'} onCheckedChange={v => pinyinFontWeight.set(v ? 'bold' : 'normal')} />
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSet className={groupCls}>
        <FieldGroup className="gap-0">
          <Field orientation="horizontal" className="h-9 !items-center gap-6">
            <FieldLabel className="!flex-none w-14 shrink-0 text-slate-700 dark:text-slate-200">字号大小</FieldLabel>
            <FieldContent className="!flex-row items-center gap-2">
              <Slider className="flex-1" value={[fontSize]} min={30} max={100} step={1} onValueChange={([v]) => pinyinFontSize.set(v)} />
              <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">
                {fontSize}
                %
              </span>
            </FieldContent>
          </Field>
          <FieldSeparator className={sepCls} />
          <Field orientation="horizontal" className="h-9 items-center justify-between gap-6">
            <FieldLabel className="text-slate-700 dark:text-slate-200">字体颜色</FieldLabel>
            <button
              className="h-7 w-7 rounded-md border"
              style={{ backgroundColor: fontColor === 'black' ? '#000' : fontColor }}
              onClick={() => setShowFontColorPicker(true)}
            />
          </Field>
        </FieldGroup>
      </FieldSet>

      <MarginDialog
        open={showMarginDialog}
        onOpenChange={setShowMarginDialog}
        margin={margin}
        onChange={v => pinyinMargin.set(v)}
      />
      <ColorPickerDialog
        open={showLineColorPicker}
        onOpenChange={setShowLineColorPicker}
        color={lineColor}
        onSelect={v => pinyinLineColor.set(v)}
      />
      <ColorPickerDialog
        open={showAnswerColorPicker}
        onOpenChange={setShowAnswerColorPicker}
        color={answerColor}
        onSelect={v => pinyinAnswerColor.set(v)}
      />
      <ColorPickerDialog
        open={showFontColorPicker}
        onOpenChange={setShowFontColorPicker}
        color={fontColor}
        onSelect={v => pinyinFontColor.set(v)}
      />
      <ColorPickerDialog
        open={showHighlightColorPicker}
        onOpenChange={setShowHighlightColorPicker}
        color={highlightColor}
        onSelect={v => pinyinHighlightColor.set(v)}
      />
      <FontPickerDialog
        open={showFontDialog}
        onOpenChange={setShowFontDialog}
        value={fontFamily}
        onSelect={v => pinyinFontFamily.set(v)}
      />
    </div>
  )
}
