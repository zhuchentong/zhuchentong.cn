import type { TextbookSentenceResult } from '@english/interfaces'
import { apiRequest } from '@english/lib/request'

import { selectedTextbookId, selectedUnitNumber } from '@english/store'
import { useStore } from '@nanostores/react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

interface AddSentenceFormProps {
  onAdded: () => void
}

export function AddSentenceForm({ onAdded }: AddSentenceFormProps) {
  const textbookId = useStore(selectedTextbookId)
  const unitNumber = useStore(selectedUnitNumber)
  const [submitting, setSubmitting] = useState(false)
  const [sentence, setSentence] = useState('')
  const [translation, setTranslation] = useState('')

  const reset = () => {
    setSentence('')
    setTranslation('')
  }

  const submit = async () => {
    if (!textbookId || unitNumber === null || !sentence.trim()) {
      return
    }
    setSubmitting(true)
    try {
      const result = await apiRequest<{ id: number, created: boolean }>('/english/api/sentences', {
        method: 'POST',
        body: JSON.stringify({
          textbookId,
          unitNumber,
          sentence: sentence.trim(),
          translation: translation.trim() || undefined,
        }),
      })
      alert(result.created ? '已添加课文句子' : '该句子已存在')
      reset()
      onAdded()
    }
    catch (err) {
      alert((err as Error).message)
    }
    finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>添加课文句子</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field>
          <FieldLabel>英文句子 *</FieldLabel>
          <Input
            value={sentence}
            onChange={e => setSentence(e.target.value)}
            placeholder="I have a dream."
          />
        </Field>
        <Field>
          <FieldLabel>中文翻译</FieldLabel>
          <Input
            value={translation}
            onChange={e => setTranslation(e.target.value)}
            placeholder="我有一个梦想。（可选）"
          />
        </Field>
        <div className="flex justify-end">
          <Button onClick={submit} disabled={submitting || !sentence.trim()}>
            {submitting ? '提交中...' : '添加到当前单元'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface SentenceListProps {
  refreshKey: number
}

export function SentenceList({ refreshKey }: SentenceListProps) {
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

  const deleteSentence = async (id: number) => {
    if (!confirm('确定删除该句子？'))
      return
    try {
      await apiRequest(`/english/api/sentences?id=${id}`, { method: 'DELETE' })
      setSentences(prev => prev.filter(s => s.id !== id))
    }
    catch (err) {
      alert((err as Error).message)
    }
  }

  // refreshKey 变化时重新加载
  useEffect(() => {
    if (textbookId && unitNumber !== null) {
      loadSentences()
    }
  }, [refreshKey, textbookId, unitNumber])

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
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{s.sentence}</p>
                      {s.translation && (
                        <p className="mt-1 text-muted-foreground">{s.translation}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 shrink-0 text-red-500 hover:text-red-700"
                      onClick={() => deleteSentence(s.id)}
                    >
                      删除
                    </Button>
                  </div>
                ))}
              </div>
            )}
      </CardContent>
    </Card>
  )
}
