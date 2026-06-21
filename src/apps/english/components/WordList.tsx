import type { WordLocation, WordWithSentences } from '@english/interfaces'
import { useStore } from '@nanostores/react'

import { apiRequest } from '@english/lib/request'
import { selectedTextbookId, selectedUnitNumber } from '@english/store'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export function WordList() {
  const textbookId = useStore(selectedTextbookId)
  const unitNumber = useStore(selectedUnitNumber)
  const [words, setWords] = useState<WordWithSentences[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!textbookId || unitNumber === null) {
      return
    }
    let active = true
    apiRequest<WordWithSentences[]>(`/english/api/words?textbookId=${textbookId}&unitNumber=${unitNumber}`)
      .then((data) => {
        if (active) {
          setWords(data)
          setLoading(false)
        }
      })
      .catch(() => {
        if (active) {
          setWords([])
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [textbookId, unitNumber])

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          当前单元单词（
          {words.length}
          ）
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">加载中...</p>}
        {!loading && words.length === 0 && (
          <p className="text-sm text-muted-foreground">暂无单词，请在上方添加。</p>
        )}
        {words.map(w => (
          <div key={w.id} className="rounded-lg border p-3">
            <div className="flex items-baseline gap-2">
              <span className="font-medium">{w.word}</span>
              {w.phonetic && <span className="text-sm text-muted-foreground">{w.phonetic}</span>}
            </div>
            <p className="text-sm">{w.meaning}</p>
            {w.sentences.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {w.sentences.map(s => (
                  <li key={s.id}>
                    <span>{s.sentence}</span>
                    {s.translation && (
                      <span className="ml-1">
                        —
                        {s.translation}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

/** 单词反查面板（独立卡片） */
export function WordSearchPanel() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<{ found: boolean, locations: WordLocation[] } | null>(null)
  const [searching, setSearching] = useState(false)

  const search = async () => {
    if (!query.trim()) {
      return
    }
    setSearching(true)
    try {
      setResult(await apiRequest(`/english/api/words-search?q=${encodeURIComponent(query.trim())}`))
    }
    finally {
      setSearching(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>反查单词出处</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            className="flex-1"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="输入单词，如 apple"
          />
          <Button onClick={search} disabled={searching || !query.trim()}>
            {searching ? '查询中...' : '查询'}
          </Button>
        </div>
        {result && (
          result.found
            ? (
                <div className="space-y-1 text-sm">
                  <p className="text-muted-foreground">该单词出现在以下位置：</p>
                  {result.locations.map(loc => (
                    <div key={`${loc.textbookName}-${loc.unitNumber}`} className="rounded border p-2">
                      <span>{`${loc.stage} · ${loc.publisher} · ${loc.textbookName}`}</span>
                      {loc.grade && (
                        <span className="ml-1">
                          {loc.grade}
                          {loc.semester}
                        </span>
                      )}
                      {loc.unitNumber > 0 && (
                        <span className="ml-1 text-muted-foreground">
                          / Unit
                          {loc.unitNumber}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )
            : <p className="text-sm text-muted-foreground">未找到该单词。</p>
        )}
      </CardContent>
    </Card>
  )
}
