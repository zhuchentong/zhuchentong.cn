import { clearWrongWords, removeWrongWord, wrongWords } from '@english/stores/wrong-words.store'
import { Icon } from '@iconify/react'
import { useStore } from '@nanostores/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function formatTime(ts: number) {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

export function WrongWordsBook() {
  const list = useStore(wrongWords)
  const [sortMode, setSortMode] = useState<'time' | 'count'>('time')

  const sorted = [...list].sort((a, b) => {
    if (sortMode === 'count')
      return b.errorCount - a.errorCount
    return b.lastSeenAt - a.lastSeenAt
  })

  const handleClear = () => {
    if (list.length === 0)
      return
    if (window.confirm(`确定要清空全部 ${list.length} 个错词吗？`)) {
      clearWrongWords()
    }
  }

  const handleRemove = (word: string) => {
    removeWrongWord(word)
  }

  return (
    <div className="flex h-full flex-col bg-background p-6 overflow-auto">
      <Card className="mx-auto w-full max-w-3xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">
              错题本
              <span className="ml-2 text-base font-normal text-muted-foreground">
                {list.length}
                {' '}
                词
              </span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortMode(sortMode === 'time' ? 'count' : 'time')}
              >
                <Icon icon="icon-park-outline:sort" className="mr-1 size-4" />
                {sortMode === 'time' ? '按错误次数' : '按最近时间'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={list.length === 0}
                onClick={handleClear}
              >
                <Icon icon="icon-park-outline:delete-five" className="mr-1 size-4" />
                清空
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sorted.length === 0
            ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <Icon icon="icon-park-outline:doc-success" className="mb-4 size-16 opacity-30" />
                  <p>还没有错词记录，继续保持！</p>
                </div>
              )
            : (
                <div className="space-y-3">
                  {sorted.map(item => (
                    <div
                      key={item.word}
                      className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50"
                    >
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-semibold tracking-wide">{item.word}</span>
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
                            错
                            {item.errorCount}
                            次
                          </span>
                        </div>
                        {item.meaning && (
                          <p className="mt-1 truncate text-sm text-muted-foreground">{item.meaning}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4 pl-4">
                        <span className="whitespace-nowrap text-xs text-muted-foreground">
                          {formatTime(item.lastSeenAt)}
                        </span>
                        <button
                          onClick={() => handleRemove(item.word)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-background hover:text-foreground"
                        >
                          <Icon icon="icon-park-outline:close-one" className="size-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
        </CardContent>
      </Card>
    </div>
  )
}
