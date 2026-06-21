import type { EnglishTextbook } from '@/database/schema'
import { PUBLISHERS, SEMESTERS, STAGES } from '@english/constants'

import { apiRequest } from '@english/lib/request'
import { selectedTextbookId, selectedUnitNumber } from '@english/store'
import { useStore } from '@nanostores/react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function TextbookUnitSelector() {
  const textbookId = useStore(selectedTextbookId)
  const unitNumber = useStore(selectedUnitNumber)
  const [textbooks, setTextbooks] = useState<EnglishTextbook[]>([])
  const [unitNumbers, setUnitNumbers] = useState<number[]>([])

  const fetchTextbooks = async () => {
    setTextbooks(await apiRequest<EnglishTextbook[]>('/english/api/textbooks'))
  }

  const fetchUnitNumbers = async (tbId: number) => {
    setUnitNumbers(await apiRequest<number[]>(`/english/api/units?textbookId=${tbId}`))
  }

  useEffect(() => {
    fetchTextbooks()
  }, [])

  const handleTextbookChange = async (value: string) => {
    const id = Number(value)
    selectedTextbookId.set(id)
    selectedUnitNumber.set(null)
    setUnitNumbers([])
    await fetchUnitNumbers(id)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>课本 / 单元</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FieldGroup>
          <Field orientation="horizontal">
            <FieldLabel className="w-20 shrink-0">课本</FieldLabel>
            <div className="flex flex-1 items-center gap-2">
              <Select value={textbookId ? String(textbookId) : ''} onValueChange={handleTextbookChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择课本" />
                </SelectTrigger>
                <SelectContent>
                  {textbooks.map(tb => (
                    <SelectItem key={tb.id} value={String(tb.id)}>
                      {`${tb.stage} · ${tb.publisher} · ${tb.name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <CreateTextbookDialog onCreated={fetchTextbooks} />
            </div>
          </Field>

          <Field orientation="horizontal">
            <FieldLabel className="w-20 shrink-0">单元</FieldLabel>
            <div className="flex flex-1 items-center gap-2">
              <Input
                className="w-28"
                type="number"
                min={0}
                disabled={!textbookId}
                value={unitNumber ?? ''}
                placeholder={textbookId ? '如 1' : '请先选择课本'}
                onChange={e => selectedUnitNumber.set(e.target.value === '' ? null : Number(e.target.value))}
              />
              {unitNumbers.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  已有单元：
                  {unitNumbers.join('、')}
                </span>
              )}
            </div>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}

/** 新建课本对话框 */
function CreateTextbookDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<{
    stage: string
    name: string
    publisher: string
    grade: string
    semester: string
  }>({
    stage: STAGES[0],
    name: '',
    publisher: PUBLISHERS[0],
    grade: '',
    semester: '',
  })

  const submit = async () => {
    if (!form.name.trim()) {
      return
    }
    setSubmitting(true)
    try {
      await apiRequest('/english/api/textbooks', {
        method: 'POST',
        body: JSON.stringify({
          stage: form.stage,
          name: form.name.trim(),
          publisher: form.publisher,
          grade: form.grade.trim() || undefined,
          semester: form.semester || undefined,
        }),
      })
      setOpen(false)
      setForm({ stage: STAGES[0], name: '', publisher: PUBLISHERS[0], grade: '', semester: '' })
      onCreated()
    }
    catch (err) {
      alert((err as Error).message)
    }
    finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">新建课本</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新建课本</DialogTitle>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel>学段</FieldLabel>
            <Select value={form.stage} onValueChange={v => setForm(f => ({ ...f, stage: v }))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>课本名称 *</FieldLabel>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="三年级下册" />
          </Field>
          <Field>
            <FieldLabel>出版社</FieldLabel>
            <Select value={form.publisher} onValueChange={v => setForm(f => ({ ...f, publisher: v }))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PUBLISHERS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <div className="flex gap-3">
            <Field className="flex-1">
              <FieldLabel>年级</FieldLabel>
              <Input value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))} placeholder="三年级" />
            </Field>
            <Field className="flex-1">
              <FieldLabel>学期</FieldLabel>
              <Select
                value={form.semester}
                onValueChange={v => setForm(f => ({ ...f, semester: v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="不限" />
                </SelectTrigger>
                <SelectContent>
                  {SEMESTERS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
          <Button onClick={submit} disabled={submitting || !form.name.trim()}>
            {submitting ? '创建中...' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
