import type { TextbookSentenceResult } from '@english/interfaces'
import { apiRequest } from '@english/lib/request'

import { selectedTextbookId, selectedUnitNumber } from '@english/store'
import { useStore } from '@nanostores/react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function SentenceList() {
  const textbookId = useStore(selectedTextbookId)
  const unitNumber = useStore(selectedUnitNumber)
  const [sentences, setSentences] = useState<TextbookSentenceResult[]>([])
  const [loading, setLoading] = useState(false)

  const loadSentences = async () => {
    if (!textbookId || unitNumber === null)
      return
    setLoading(true)
    try {
      const data = await apiRequest<TextbookSentenceResult[]>(
        `/english/api/sentences?textbookId=${textbookId}&unitNumber=${unitNumber}`,
      )
      setSentences(data)
    }
    finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (textbookId && unitNumber !== null) {
      loadSentences()
    }
    // eslint-disable-next-line react/exhaustive-deps -- loadSentences 仅依赖已在 deps 中的值，加入会导致重复请求
  }, [textbookId, unitNumber])

  if (!textbookId || unitNumber === null)
    return null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>课文句子列表</CardTitle>
          <Button variant="outline" size="sm" onClick={loadSentences} disabled={loading}>
            {loading ? '加载中...' : '刷新'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {sentences.length === 0
          ? (
              <p className="text-sm text-muted-foreground">暂无课文句子</p>
            )
          : (
              <div className="space-y-2">
                {sentences.map(s => (
                  <div key={s.id} className="flex items-start justify-between rounded border border-border p-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{s.sentence}</p>
                      {s.translation && (
                        <p className="mt-1 text-muted-foreground">{s.translation}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
      </CardContent>
    </Card>
  )
}
