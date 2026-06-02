import type { Margin } from '../interfaces'
import { useStore } from '@nanostores/react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldContent, FieldGroup, FieldLabel, FieldSeparator, FieldSet } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { generateQuiz } from '../composables/useQuizGenerator'
import { CHAPTERS, COLOR_PALETTE, DEFAULT_MARGIN, DEFAULT_PINYIN_CONFIG } from '../config'
import {
  pinyinAnswerColor,
  pinyinAnswerMode,
  pinyinChapter,
  pinyinFontColor,
  pinyinFontSize,
  pinyinGridSize,
  pinyinHighlightColor,
  pinyinHighlightEnabled,
  pinyinLineColor,
  pinyinMargin,
  pinyinQuestionCount,
  pinyinQuestionGap,
  pinyinQuestions,
  pinyinSeed,
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

export default function ControlPanel() {
  const chapter = useStore(pinyinChapter)
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
  const highlightColor = useStore(pinyinHighlightColor)

  const [showMarginDialog, setShowMarginDialog] = useState(false)
  const [showLineColorPicker, setShowLineColorPicker] = useState(false)
  const [showAnswerColorPicker, setShowAnswerColorPicker] = useState(false)
  const [showFontColorPicker, setShowFontColorPicker] = useState(false)
  const [showHighlightColorPicker, setShowHighlightColorPicker] = useState(false)

  useEffect(() => {
    const seed = pinyinSeed.get()
    pinyinSeed.set(seed)
    pinyinQuestions.set(generateQuiz(chapter, seed, questionCount))
  }, [chapter, questionCount])

  function regenerate() {
    const newSeed = Date.now()
    pinyinSeed.set(newSeed)
    pinyinQuestions.set(generateQuiz(chapter, newSeed, questionCount))
  }

  function resetAll() {
    pinyinChapter.set(DEFAULT_PINYIN_CONFIG.chapter)
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
    const newSeed = Date.now()
    pinyinSeed.set(newSeed)
    pinyinQuestions.set(generateQuiz(DEFAULT_PINYIN_CONFIG.chapter, newSeed, DEFAULT_PINYIN_CONFIG.questionCount))
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
          <Field orientation="horizontal" className="h-9 !items-center gap-6">
            <FieldLabel className="!flex-none w-14 shrink-0 text-slate-700 dark:text-slate-200">练习章节</FieldLabel>
            <FieldContent className="flex-1">
              <Select value={String(chapter)} onValueChange={v => pinyinChapter.set(Number(v))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHAPTERS.map(ch => (
                    <SelectItem key={ch.id} value={String(ch.id)}>
                      {ch.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>
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
    </div>
  )
}
