import type { EnglishTextbook } from '@/database/schema'

import { STAGES } from '@english/constants'
import { apiRequest } from '@english/lib/request'
import { Icon } from '@iconify/react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function TextbookGallery() {
  const [stage, setStage] = useState<string>(STAGES[0])
  const [textbooks, setTextbooks] = useState<EnglishTextbook[]>([])
  const [loading, setLoading] = useState(true)

  // 从 URL 读取学习类型（惰性初始化，避免 useEffect 中同步 setState）
  const [learnType] = useState<'word' | 'sentence'>(() => {
    if (typeof window === 'undefined')
      return 'word'
    const params = new URLSearchParams(window.location.search)
    return params.get('type') === 'sentence' ? 'sentence' : 'word'
  })

  // Dialog 状态
  const [selectedTextbook, setSelectedTextbook] = useState<EnglishTextbook | null>(null)
  const [unitNumbers, setUnitNumbers] = useState<number[]>([])
  const [loadingUnits, setLoadingUnits] = useState(false)

  // 加载课本列表
  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect -- 数据获取的标准 loading 模式，多一次渲染可忽略
    setLoading(true)
    apiRequest<EnglishTextbook[]>(`/english/api/textbooks?stage=${encodeURIComponent(stage)}`)
      .then(setTextbooks)
      .finally(() => setLoading(false))
  }, [stage])

  // 点击卡片，打开 Dialog 加载单元列表
  const handleCardClick = async (textbook: EnglishTextbook) => {
    setSelectedTextbook(textbook)
    setLoadingUnits(true)
    try {
      const units = await apiRequest<number[]>(`/english/api/units?textbookId=${textbook.id}`)
      setUnitNumbers(units)
    }
    finally {
      setLoadingUnits(false)
    }
  }

  // 选择单元，跳转到 learner
  const handleUnitClick = (unitNumber: number) => {
    if (!selectedTextbook)
      return
    window.location.href = `/english/learner?type=${learnType}&textbookId=${selectedTextbook.id}&unitNumber=${unitNumber}`
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* 顶部导航 */}
      <div className="flex items-center gap-4 border-b border-border px-6 py-4">
        <a href="/english" className="text-muted-foreground hover:text-foreground">
          <Icon icon="icon-park-outline:left" className="size-5" />
        </a>
        <h1 className="text-lg font-semibold">
          选择学习内容（
          {learnType === 'sentence' ? '句子' : '单词'}
          ）
        </h1>
      </div>

      {/* Tabs 切换学段 */}
      <div className="flex gap-2 border-b border-border px-6 py-3">
        {STAGES.map(s => (
          <button
            key={s}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              stage === s
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            onClick={() => setStage(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {/* 课本卡片列表 */}
      <div className="flex-1 overflow-auto p-6">
        {loading
          ? (
              <div className="flex h-40 items-center justify-center text-muted-foreground">
                加载中...
              </div>
            )
          : textbooks.length === 0
            ? (
                <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Icon icon="icon-park-outline:empty" className="size-10" />
                  <p>暂无课本数据</p>
                </div>
              )
            : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {textbooks.map(tb => (
                    <Card
                      key={tb.id}
                      className="cursor-pointer transition-all hover:border-foreground/20 hover:shadow-md"
                      onClick={() => handleCardClick(tb)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                            <Icon icon="icon-park-outline:book-one" className="size-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="truncate text-base">{tb.name}</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{tb.publisher}</p>
                        {tb.grade && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {tb.grade}
                            {tb.semester ? ` · ${tb.semester}学期` : ''}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
      </div>

      {/* 单元选择 Dialog */}
      <Dialog open={!!selectedTextbook} onOpenChange={open => !open && setSelectedTextbook(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedTextbook?.publisher}
              {' '}
              ·
              {selectedTextbook?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {loadingUnits
              ? (
                  <div className="flex h-20 items-center justify-center text-muted-foreground">
                    加载中...
                  </div>
                )
              : unitNumbers.length === 0
                ? (
                    <div className="flex h-20 items-center justify-center text-muted-foreground">
                      暂无单元数据
                    </div>
                  )
                : (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">选择学习单元：</p>
                      <div className="grid max-h-[60vh] grid-cols-3 gap-2 overflow-y-auto pr-1">
                        {unitNumbers.map(n => (
                          <Button
                            key={n}
                            variant="outline"
                            className="h-auto py-3"
                            onClick={() => handleUnitClick(n)}
                          >
                            {n === 0 ? '全部' : `Unit ${n}`}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
