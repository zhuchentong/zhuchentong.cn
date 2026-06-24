import type { EnglishTextbook } from '@/database/schema'

import { apiRequest } from '@english/lib/request'
import { selectedTextbookId, selectedUnitNumber } from '@english/store'
import { useStore } from '@nanostores/react'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
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
  const [units, setUnits] = useState<{ unitNumber: number, title: string | null }[]>([])

  const fetchTextbooks = async () => {
    setTextbooks(await apiRequest<EnglishTextbook[]>('/english/api/textbooks'))
  }

  const fetchUnitNumbers = async (tbId: number) => {
    setUnits(await apiRequest<{ unitNumber: number, title: string | null }[]>(`/english/api/units?textbookId=${tbId}`))
  }

  useEffect(() => {
    fetchTextbooks()
  }, [])

  const handleTextbookChange = async (value: string) => {
    const id = Number(value)
    selectedTextbookId.set(id)
    selectedUnitNumber.set(null)
    setUnits([])
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
          </Field>

          <Field orientation="horizontal">
            <FieldLabel className="w-20 shrink-0">单元</FieldLabel>
            <Select
              value={unitNumber !== null ? String(unitNumber) : ''}
              onValueChange={v => selectedUnitNumber.set(Number(v))}
              disabled={!textbookId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={textbookId ? '选择单元' : '请先选择课本'} />
              </SelectTrigger>
              <SelectContent>
                {units.map(u => (
                  <SelectItem key={u.unitNumber} value={String(u.unitNumber)}>
                    {u.title ? `Unit ${u.unitNumber} · ${u.title}` : `Unit ${u.unitNumber}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}
