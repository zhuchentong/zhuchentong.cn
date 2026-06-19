import type { AddWordResult } from '@wordbook/interfaces'
import { useStore } from '@nanostores/react'

import { apiRequest } from '@wordbook/lib/request'
import { selectedTextbookId, selectedUnitNumber } from '@wordbook/store'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

interface SentenceRow {
  id: number
  sentence: string
  translation: string
}

export function AddWordForm({ onAdded }: { onAdded: () => void }) {
  const textbookId = useStore(selectedTextbookId)
  const unitNumber = useStore(selectedUnitNumber)
  const [submitting, setSubmitting] = useState(false)
  const [word, setWord] = useState('')
  const [phonetic, setPhonetic] = useState('')
  const [meaning, setMeaning] = useState('')
  const [sentences, setSentences] = useState<SentenceRow[]>([])
  const sentenceIdRef = useRef(0)

  const addSentence = () =>
    setSentences(s => [...s, { id: sentenceIdRef.current++, sentence: '', translation: '' }])
  const removeSentence = (i: number) => setSentences(s => s.filter((_, idx) => idx !== i))
  const updateSentence = (i: number, key: 'sentence' | 'translation', value: string) =>
    setSentences(s => s.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)))

  const reset = () => {
    setWord('')
    setPhonetic('')
    setMeaning('')
    setSentences([])
  }

  const submit = async () => {
    if (!textbookId || unitNumber === null || !word.trim() || !meaning.trim()) {
      return
    }
    setSubmitting(true)
    try {
      const result = await apiRequest<AddWordResult>('/wordbook/api/words', {
        method: 'POST',
        body: JSON.stringify({
          textbookId,
          unitNumber,
          word: word.trim(),
          phonetic: phonetic.trim() || undefined,
          meaning: meaning.trim(),
          sentences: sentences
            .filter(s => s.sentence.trim())
            .map(s => ({
              sentence: s.sentence.trim(),
              translation: s.translation.trim() || undefined,
            })),
        }),
      })
      alert(result.created ? '已添加新单词' : '单词已存在，已更新释义并关联到当前单元')
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
        <CardTitle>添加单词</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Field className="flex-1">
            <FieldLabel>单词 *</FieldLabel>
            <Input value={word} onChange={e => setWord(e.target.value)} placeholder="apple" />
          </Field>
          <Field className="flex-1">
            <FieldLabel>音标</FieldLabel>
            <Input value={phonetic} onChange={e => setPhonetic(e.target.value)} placeholder="/ˈæpl/" />
          </Field>
        </div>
        <Field>
          <FieldLabel>中文释义 *</FieldLabel>
          <Input value={meaning} onChange={e => setMeaning(e.target.value)} placeholder="苹果" />
        </Field>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">例句</span>
            <Button variant="outline" size="sm" onClick={addSentence}>+ 添加例句</Button>
          </div>
          {sentences.map((row, i) => (
            <div key={row.id} className="flex gap-2">
              <Input
                className="flex-1"
                value={row.sentence}
                onChange={e => updateSentence(i, 'sentence', e.target.value)}
                placeholder="英文例句"
              />
              <Input
                className="flex-1"
                value={row.translation}
                onChange={e => updateSentence(i, 'translation', e.target.value)}
                placeholder="中文翻译（可选）"
              />
              <Button variant="ghost" size="icon" onClick={() => removeSentence(i)}>×</Button>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button onClick={submit} disabled={submitting || !word.trim() || !meaning.trim()}>
            {submitting ? '提交中...' : '添加到当前单元'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
