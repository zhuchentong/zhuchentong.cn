import { apiRequest } from '@chinese/lib/request'
import { Icon } from '@iconify/react'
import { useEffect, useState } from 'react'

/** 教材列表项（listChineseTextbooks 返回形状，不含 publisher） */
interface TextbookItem {
  id: number
  name: string
  grade: string | null
  semester: string | null
}

interface LessonItem {
  id: number
  lessonNumber: number | null
  title: string | null
  type: string
}

interface UnitGroup {
  unitNumber: number
  unitTitle: string | null
  lessons: LessonItem[]
}

type PracticeType = 'word' | 'char' | 'all'

const TYPE_TABS: { value: PracticeType, label: string }[] = [
  { value: 'word', label: '词语' },
  { value: 'char', label: '生字' },
  { value: 'all', label: '全部' },
]

export function TextbookLessonSelector() {
  const [textbooks, setTextbooks] = useState<TextbookItem[]>([])
  const [textbookId, setTextbookId] = useState<number | null>(null)
  const [units, setUnits] = useState<UnitGroup[]>([])
  const [loadingBooks, setLoadingBooks] = useState(true)
  const [loadingUnits, setLoadingUnits] = useState(false)
  const [practiceType, setPracticeType] = useState<PracticeType>('word')

  // 加载教材列表
  useEffect(() => {
    apiRequest<TextbookItem[]>('/chinese/api/textbooks')
      .then(setTextbooks)
      .catch((err) => {
        console.error('加载教材失败:', err)
        alert('加载教材失败')
      })
      .finally(() => setLoadingBooks(false))
  }, [])

  // 选择教材 → 加载单元/篇目树
  const handleTextbookChange = async (id: number) => {
    setTextbookId(id)
    setUnits([])
    setLoadingUnits(true)
    try {
      const data = await apiRequest<UnitGroup[]>(`/chinese/api/lessons?textbookId=${id}`)
      setUnits(data)
    }
    catch (err) {
      console.error('加载篇目失败:', err)
      alert('加载篇目失败')
    }
    finally {
      setLoadingUnits(false)
    }
  }

  const handleLessonClick = (lessonId: number) => {
    window.location.href = `/chinese/typing?lessonId=${lessonId}&type=${practiceType}`
  }

  const currentTextbook = textbooks.find(tb => tb.id === textbookId)

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* 顶部导航 */}
      <div className="flex items-center gap-4 border-b border-border px-6 py-4">
        <a href="/chinese" className="text-muted-foreground hover:text-foreground">
          <Icon icon="icon-park-outline:left" className="size-5" />
        </a>
        <h1 className="text-lg font-semibold">选择课文</h1>
      </div>

      {/* 教材选择 + 练习类型 */}
      <div className="flex flex-wrap items-center gap-4 border-b border-border px-6 py-3">
        <select
          className="rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm outline-none focus-visible:border-ring"
          value={textbookId ?? ''}
          onChange={e => handleTextbookChange(Number(e.target.value))}
        >
          <option value="" disabled>选择教材</option>
          {textbooks.map(tb => (
            <option key={tb.id} value={tb.id}>
              {`${tb.grade ?? ''}${tb.semester ?? ''} · ${tb.name}`}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
          {TYPE_TABS.map(t => (
            <button
              key={t.value}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                practiceType === t.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setPracticeType(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 单元/篇目列表 */}
      <div className="flex-1 overflow-auto p-6">
        {loadingBooks
          ? (
              <div className="flex h-40 items-center justify-center text-muted-foreground">加载中...</div>
            )
          : !textbookId
              ? (
                  <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Icon icon="icon-park-outline:book-one" className="size-10" />
                    <p>请先选择教材</p>
                  </div>
                )
              : loadingUnits
                ? (
                    <div className="flex h-40 items-center justify-center text-muted-foreground">加载中...</div>
                  )
                : units.length === 0
                  ? (
                      <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Icon icon="icon-park-outline:empty" className="size-10" />
                        <p>暂无篇目数据</p>
                      </div>
                    )
                  : (
                      <div className="mx-auto max-w-3xl space-y-6">
                        {currentTextbook && (
                          <p className="text-sm text-muted-foreground">
                            {currentTextbook.grade ?? ''}
                            {currentTextbook.semester ?? ''}
                            {' · '}
                            {currentTextbook.name}
                          </p>
                        )}
                        {units.map(unit => (
                          <div key={unit.unitNumber}>
                            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
                              第
                              {unit.unitNumber}
                              单元
                              {unit.unitTitle ? ` · ${unit.unitTitle}` : ''}
                            </h2>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                              {unit.lessons.map(ls => (
                                <button
                                  key={ls.id}
                                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-left text-sm transition-colors hover:border-foreground/20 hover:bg-accent"
                                  onClick={() => handleLessonClick(ls.id)}
                                >
                                  <span className="text-muted-foreground">
                                    {ls.type === 'garden'
                                      ? <Icon icon="icon-park-outline:tree-one" className="size-4" />
                                      : ls.lessonNumber ?? '·'}
                                  </span>
                                  <span className="truncate">{ls.title ?? '未命名'}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
      </div>
    </div>
  )
}
