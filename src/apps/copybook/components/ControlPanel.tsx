import type { GridType } from '@copybook/interfaces'
import { DEFAULT_CONFIG, FONTS, GRID_TYPES } from '@copybook/config'
import { A4_WIDTH_MM } from '@copybook/constants'
import {
  copybookFontFamily,
  copybookFontOffsetY,
  copybookFontSize,
  copybookFontWeight,
  copybookGridSize,
  copybookGridType,
  copybookHighlightFirst,
  copybookInsertEmptyCol,
  copybookInsertEmptyRow,
  copybookLineColor,
  copybookMargin,
  copybookPinyinMap,
  copybookRowGap,
  copybookShowPinyin,
  copybookText,
  copybookTraceColor,
  copybookTraceCount,
} from '@copybook/store'
import { useStore } from '@nanostores/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldContent, FieldGroup, FieldLabel, FieldSeparator, FieldSet } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import ColorPickerDialog from './ColorPickerDialog'
import ExportButton from './ExportButton'
import FontPickerDialog from './FontPickerDialog'
import MarginDialog from './MarginDialog'
import TextInputDialog from './TextInputDialog'

const groupCls = 'bg-background rounded-md border px-3 py-[2px] shadow-xs'
const sepCls = 'h-px my-0'

export default function ControlPanel() {
  const text = useStore(copybookText)
  const gridType = useStore(copybookGridType)
  const gridSize = useStore(copybookGridSize)
  const rowGap = useStore(copybookRowGap)
  const fontWeight = useStore(copybookFontWeight)
  const fontSize = useStore(copybookFontSize)
  const fontOffsetY = useStore(copybookFontOffsetY)
  const traceCount = useStore(copybookTraceCount)
  const traceColor = useStore(copybookTraceColor)
  const lineColor = useStore(copybookLineColor)
  const highlightFirst = useStore(copybookHighlightFirst)
  const insertEmptyRow = useStore(copybookInsertEmptyRow)
  const insertEmptyCol = useStore(copybookInsertEmptyCol)
  const margin = useStore(copybookMargin)
  const fontFamily = useStore(copybookFontFamily)
  const showPinyin = useStore(copybookShowPinyin)

  const colsPerRow = Math.floor((A4_WIDTH_MM - margin.left - margin.right) / gridSize) || 1
  const contentCols = insertEmptyCol ? Math.ceil(colsPerRow / 2) : colsPerRow
  const maxTraceCount = Math.max(contentCols, 1)

  const [showTextDialog, setShowTextDialog] = useState(false)
  const [showMarginDialog, setShowMarginDialog] = useState(false)
  const [showFontDialog, setShowFontDialog] = useState(false)
  const [showTraceColorPicker, setShowTraceColorPicker] = useState(false)
  const [showLineColorPicker, setShowLineColorPicker] = useState(false)

  function resetAll() {
    copybookText.set(DEFAULT_CONFIG.text)
    copybookGridType.set(DEFAULT_CONFIG.gridType)
    copybookGridSize.set(DEFAULT_CONFIG.gridSize)
    copybookRowGap.set(DEFAULT_CONFIG.rowGap)
    copybookMargin.set({ ...DEFAULT_CONFIG.margin })
    copybookFontFamily.set(DEFAULT_CONFIG.fontFamily)
    copybookFontWeight.set(DEFAULT_CONFIG.fontWeight)
    copybookFontSize.set(DEFAULT_CONFIG.fontSize)
    copybookFontOffsetY.set(DEFAULT_CONFIG.fontOffsetY)
    copybookTraceCount.set(DEFAULT_CONFIG.traceCount)
    copybookTraceColor.set(DEFAULT_CONFIG.traceColor)
    copybookLineColor.set(DEFAULT_CONFIG.lineColor)
    copybookHighlightFirst.set(DEFAULT_CONFIG.highlightFirst)
    copybookInsertEmptyRow.set(DEFAULT_CONFIG.insertEmptyRow)
    copybookInsertEmptyCol.set(DEFAULT_CONFIG.insertEmptyCol)
    copybookShowPinyin.set(DEFAULT_CONFIG.showPinyin)
    copybookPinyinMap.set({})
  }

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={resetAll}>
          重置
        </Button>
        <ExportButton />
      </div>

      <button
        className="flex h-9 items-center rounded-md border px-3 shadow-xs hover:bg-accent"
        onClick={() => setShowTextDialog(true)}
      >
        <span className="truncate">{text || '点击输入汉字'}</span>
      </button>

      <FieldSet className={groupCls}>
        <FieldGroup className="gap-0">
          <Field orientation="horizontal" className="h-9 items-center justify-between gap-6">
            <FieldLabel className="text-slate-700 dark:text-slate-200">首字高亮</FieldLabel>
            <Switch checked={highlightFirst} onCheckedChange={v => copybookHighlightFirst.set(v)} />
          </Field>
          <FieldSeparator className={sepCls} />
          <Field orientation="horizontal" className="h-9 items-center justify-between gap-6">
            <FieldLabel className="text-slate-700 dark:text-slate-200">插入空行</FieldLabel>
            <Switch checked={insertEmptyRow} onCheckedChange={v => copybookInsertEmptyRow.set(v)} />
          </Field>
          <FieldSeparator className={sepCls} />
          <Field orientation="horizontal" className="h-9 items-center justify-between gap-6">
            <FieldLabel className="text-slate-700 dark:text-slate-200">插入空列</FieldLabel>
            <Switch checked={insertEmptyCol} onCheckedChange={v => copybookInsertEmptyCol.set(v)} />
          </Field>
          <FieldSeparator className={sepCls} />
          <Field orientation="horizontal" className="h-9 items-center justify-between gap-6">
            <FieldLabel className="text-slate-700 dark:text-slate-200">显示拼音</FieldLabel>
            <Switch checked={showPinyin} onCheckedChange={v => copybookShowPinyin.set(v)} />
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSet className={groupCls}>
        <FieldGroup className="gap-0">
          <Field orientation="horizontal" className="h-9 !items-center gap-6">
            <FieldLabel className="!flex-none w-14 shrink-0 text-slate-700 dark:text-slate-200">方格类型</FieldLabel>
            <FieldContent className="flex-1">
              <Select value={gridType} onValueChange={v => copybookGridType.set(v as GridType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRID_TYPES.map(gt => (
                    <SelectItem key={gt.value} value={gt.value}>{gt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>
          <FieldSeparator className={sepCls} />
          <Field orientation="horizontal" className="h-9 !items-center gap-6">
            <FieldLabel className="!flex-none w-14 shrink-0 text-slate-700 dark:text-slate-200">方格大小</FieldLabel>
            <FieldContent className="!flex-row items-center gap-2">
              <Slider className="flex-1" value={[gridSize]} min={6} max={60} step={1} onValueChange={([v]) => copybookGridSize.set(v)} />
              <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">
                {gridSize}
                mm
              </span>
            </FieldContent>
          </Field>
          <FieldSeparator className={sepCls} />
          <Field orientation="horizontal" className="h-9 !items-center gap-6">
            <FieldLabel className="!flex-none w-14 shrink-0 text-slate-700 dark:text-slate-200">行间距</FieldLabel>
            <FieldContent className="!flex-row items-center gap-2">
              <Slider className="flex-1" value={[rowGap]} min={0} max={10} step={1} onValueChange={([v]) => copybookRowGap.set(v)} />
              <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">
                {rowGap}
                mm
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
          <button className="flex h-9 w-full items-center justify-between hover:bg-accent" onClick={() => setShowFontDialog(true)}>
            <FieldLabel className="text-slate-700 dark:text-slate-200">字体</FieldLabel>
            <span className="text-muted-foreground">{FONTS.find(f => f.id === fontFamily)?.label ?? '选择...'}</span>
          </button>
          <FieldSeparator className={sepCls} />
          <Field orientation="horizontal" className="h-9 items-center justify-between gap-6">
            <FieldLabel className="text-slate-700 dark:text-slate-200">字体加粗</FieldLabel>
            <Switch checked={fontWeight === 'bold'} onCheckedChange={v => copybookFontWeight.set(v ? 'bold' : 'normal')} />
          </Field>
          <FieldSeparator className={sepCls} />
          <Field orientation="horizontal" className="h-9 !items-center gap-6">
            <FieldLabel className="!flex-none w-14 shrink-0 text-slate-700 dark:text-slate-200">字体大小</FieldLabel>
            <FieldContent className="!flex-row items-center gap-2">
              <Slider className="flex-1" value={[fontSize]} min={48} max={128} step={1} onValueChange={([v]) => copybookFontSize.set(v)} />
              <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">
                {fontSize}
                %
              </span>
            </FieldContent>
          </Field>
          <FieldSeparator className={sepCls} />
          <Field orientation="horizontal" className="h-9 !items-center gap-6">
            <FieldLabel className="!flex-none w-14 shrink-0 text-slate-700 dark:text-slate-200">上下偏移</FieldLabel>
            <FieldContent className="!flex-row items-center gap-2">
              <Slider className="flex-1" value={[fontOffsetY]} min={-50} max={50} step={1} onValueChange={([v]) => copybookFontOffsetY.set(v)} />
              <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">
                {fontOffsetY}
                %
              </span>
            </FieldContent>
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSet className={groupCls}>
        <FieldGroup className="gap-0">
          <Field orientation="horizontal" className="h-9 !items-center gap-6">
            <FieldLabel className="!flex-none w-14 shrink-0 text-slate-700 dark:text-slate-200">描红数量</FieldLabel>
            <FieldContent className="!flex-row items-center gap-2">
              <Slider className="flex-1" value={[traceCount]} min={0} max={maxTraceCount} step={1} onValueChange={([v]) => copybookTraceCount.set(v)} />
              <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">{traceCount}</span>
            </FieldContent>
          </Field>
          <FieldSeparator className={sepCls} />
          <Field orientation="horizontal" className="h-9 items-center justify-between gap-6">
            <FieldLabel className="text-slate-700 dark:text-slate-200">描红颜色</FieldLabel>
            <button
              className="h-7 w-7 rounded-md border"
              style={{ backgroundColor: traceColor === 'black' ? '#000' : traceColor }}
              onClick={() => setShowTraceColorPicker(true)}
            />
          </Field>
          <FieldSeparator className={sepCls} />
          <Field orientation="horizontal" className="h-9 items-center justify-between gap-6">
            <FieldLabel className="text-slate-700 dark:text-slate-200">线条颜色</FieldLabel>
            <button
              className="h-7 w-7 rounded-md border"
              style={{ backgroundColor: lineColor === 'black' ? '#000' : lineColor }}
              onClick={() => setShowLineColorPicker(true)}
            />
          </Field>
        </FieldGroup>
      </FieldSet>

      <TextInputDialog open={showTextDialog} onOpenChange={setShowTextDialog} />
      <MarginDialog open={showMarginDialog} onOpenChange={setShowMarginDialog} />
      <FontPickerDialog open={showFontDialog} onOpenChange={setShowFontDialog} />
      <ColorPickerDialog
        open={showTraceColorPicker}
        onOpenChange={setShowTraceColorPicker}
        color={traceColor}
        onSelect={v => copybookTraceColor.set(v)}
      />
      <ColorPickerDialog
        open={showLineColorPicker}
        onOpenChange={setShowLineColorPicker}
        color={lineColor}
        onSelect={v => copybookLineColor.set(v)}
      />
    </div>
  )
}
