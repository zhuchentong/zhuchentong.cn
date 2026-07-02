import type { ChineseLessonContent, ChineseUnitGroup } from '@chinese/services/chinese.service'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'

/** 教材摘要（API 返回） */
interface TextbookBrief {
  id: number
  name: string
  grade: string | null
  semester: string | null
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 导入回调：把拼装好的纯文本交给父级（填进 textarea） */
  onImport: (text: string) => void
}

/** 统一 GET 请求：返回 data 字段 */
async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url)
  const json = await res.json()
  if (!res.ok)
    throw new Error(json.error ?? `HTTP ${res.status}`)
  return json.data as T
}

/** 阿拉伯数字 → 简单中文数字（单元号 1-10） */
const CN = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']

/** 可切换勾选按钮样式 */
function pillClass(active: boolean, disabled: boolean): string {
  if (disabled)
    return 'rounded-md border px-3 py-1.5 text-sm opacity-40 cursor-not-allowed'
  return `rounded-md border px-3 py-1.5 text-sm transition-colors ${active ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent'}`
}

function rowClass(active: boolean) {
  return `w-full rounded-md px-3 py-1.5 text-left text-sm ${active ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`
}

export default function TextbookPickerDialog({ open, onOpenChange, onImport }: Props) {
  const [textbooks, setTextbooks] = useState<TextbookBrief[]>([])
  const [textbookId, setTextbookId] = useState<number | null>(null)
  const [units, setUnits] = useState<ChineseUnitGroup[]>([])
  const [lessonId, setLessonId] = useState<number | null>(null)
  const [content, setContent] = useState<ChineseLessonContent | null>(null)
  const [loading, setLoading] = useState(false)
  const [cats, setCats] = useState<{ yilei: boolean, erlei: boolean }>({ yilei: false, erlei: false })

  // 打开时加载教材列表（setState 在 then 内，非同步）
  useEffect(() => {
    if (open && textbooks.length === 0)
      apiFetch<TextbookBrief[]>('/chinese/api/textbooks').then(setTextbooks).catch(() => {})
  }, [open, textbooks.length])

  // 切换教材 → 加载篇目树
  useEffect(() => {
    if (textbookId == null)
      return
    apiFetch<ChineseUnitGroup[]>(`/chinese/api/lessons?textbookId=${textbookId}`).then(setUnits).catch(() => {})
  }, [textbookId])

  // 切换课文 → 加载生字内容
  useEffect(() => {
    if (lessonId == null)
      return
    apiFetch<ChineseLessonContent>(`/chinese/api/content?lessonId=${lessonId}`)
      .then(setContent)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [lessonId])

  /** 选教材：重置下级选择 */
  function selectTextbook(id: number) {
    if (id === textbookId)
      return // 已选中，忽略重复点击
    setTextbookId(id)
    setUnits([])
    setLessonId(null)
    setContent(null)
    setCats({ yilei: false, erlei: false })
  }

  /** 选课文：重置内容与勾选 */
  function selectLesson(id: number) {
    if (id === lessonId)
      return // 已选中，忽略重复点击
    setLessonId(id)
    setContent(null)
    setLoading(true)
    setCats({ yilei: false, erlei: false })
  }

  // 拼装纯文本：一类字 + 二类字（字帖仅支持单字）
  const built = (() => {
    if (!content)
      return ''
    let t = ''
    if (cats.yilei)
      t += content.yilei.join('')
    if (cats.erlei)
      t += content.erlei.map(e => e.char).join('')
    return t
  })()

  // 用纯 overlay 实现（非 Radix Dialog），避免与外层弹窗堆叠时 Radix 模态连锁关闭
  if (!open)
    return null

  // 通过 portal 挂到 body：脱离 PanelDrawer <aside> 的 transform 包含块与层叠上下文，
  // 使 fixed 定位相对视口（居中）、z-index 能盖过外层 Radix Dialog(z-50)
  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 supports-backdrop-filter:backdrop-blur-xs"
      onClick={() => onOpenChange(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="从教材导入"
        className="grid w-full max-w-3xl gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/10"
        onClick={e => e.stopPropagation()}
      >
        <div className="font-heading text-base font-medium leading-none">
          从教材导入
        </div>

        <div className="flex h-[60vh] gap-3">
          {/* 左栏：教材 */}
          <div className="w-1/3 shrink-0 space-y-1 overflow-y-auto rounded-md border p-2">
            {textbooks.map(tb => (
              <button
                key={tb.id}
                className={rowClass(textbookId === tb.id)}
                onClick={() => selectTextbook(tb.id)}
              >
                <div className="font-medium">{tb.name}</div>
                <div className={`text-xs ${textbookId === tb.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {tb.grade}
                  {tb.semester ? ` · ${tb.semester}` : ''}
                </div>
              </button>
            ))}
          </div>

          {/* 右栏：课文 + 内容勾选 */}
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex-1 space-y-3 overflow-y-auto rounded-md border p-2">
              {textbookId == null
                ? (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      请选择教材
                    </div>
                  )
                : units.map(u => (
                    <div key={u.unitNumber}>
                      <div className="px-1 pb-1 text-xs font-medium text-muted-foreground">
                        第
                        {CN[u.unitNumber] ?? u.unitNumber}
                        单元
                        {u.unitTitle ? ` · ${u.unitTitle}` : ''}
                      </div>
                      <div className="space-y-1">
                        {u.lessons.map(ls => (
                          <button
                            key={ls.id}
                            className={rowClass(lessonId === ls.id)}
                            onClick={() => selectLesson(ls.id)}
                          >
                            {ls.type === 'garden'
                              ? `语文园地${ls.title && ls.title !== '语文园地' ? ` · ${ls.title}` : ''}`
                              : `${ls.lessonNumber ? `${ls.lessonNumber} ` : ''}${ls.title}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
            </div>

            {/* 内容勾选 + 预览 */}
            <div className="space-y-2 rounded-md border p-2">
              {lessonId == null
                ? (
                    <div className="py-2 text-center text-muted-foreground">请选择课文</div>
                  )
                : loading
                  ? (
                      <div className="py-2 text-center text-muted-foreground">加载中…</div>
                    )
                  : content && (
                    <>
                      <div className="flex gap-2">
                        <button
                          className={pillClass(cats.yilei, content.yilei.length === 0)}
                          disabled={content.yilei.length === 0}
                          onClick={() => setCats(c => ({ ...c, yilei: !c.yilei }))}
                        >
                          一类字(
                          {content.yilei.length}
                          )
                        </button>
                        <button
                          className={pillClass(cats.erlei, content.erlei.length === 0)}
                          disabled={content.erlei.length === 0}
                          onClick={() => setCats(c => ({ ...c, erlei: !c.erlei }))}
                        >
                          二类字(
                          {content.erlei.length}
                          )
                        </button>
                      </div>
                      {built && (
                        <div className="max-h-20 overflow-y-auto break-all rounded bg-muted/50 p-2 leading-relaxed">
                          {built}
                        </div>
                      )}
                    </>
                  )}
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <div />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button
              disabled={!built}
              onClick={() => {
                onImport(built)
                onOpenChange(false)
              }}
            >
              导入
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
