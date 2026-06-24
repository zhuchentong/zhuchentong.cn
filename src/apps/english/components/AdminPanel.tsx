import type { EnglishTextbook } from '@/database/schema'

import { apiRequest } from '@english/lib/request'
import { selectedTextbookId, selectedUnitNumber } from '@english/store'
import { useStore } from '@nanostores/react'
import { useEffect, useState } from 'react'

import { SentenceList } from './SentenceList'
import { TextbookCoverManager } from './TextbookCoverManager'
import { TextbookUnitSelector } from './TextbookUnitSelector'
import { WordList, WordSearchPanel } from './WordList'

export function AdminPanel() {
  const textbookId = useStore(selectedTextbookId)
  const unitNumber = useStore(selectedUnitNumber)
  const [textbooks, setTextbooks] = useState<EnglishTextbook[]>([])

  useEffect(() => {
    apiRequest<EnglishTextbook[]>('/english/api/textbooks').then(setTextbooks)
  }, [])

  const currentTextbook = textbooks.find(tb => tb.id === textbookId)

  const handleCoverUpdated = (newUrl: string) => {
    setTextbooks(prev => prev.map(tb =>
      tb.id === textbookId ? { ...tb, coverUrl: newUrl } : tb,
    ))
  }

  return (
    <div className="h-full overflow-auto bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-xl font-semibold">数据管理</h1>
        <TextbookUnitSelector />
        {textbookId && currentTextbook && (
          <TextbookCoverManager
            key={textbookId}
            textbookId={textbookId}
            initialCoverUrl={currentTextbook.coverUrl ?? null}
            onCoverUpdated={handleCoverUpdated}
          />
        )}
        <WordSearchPanel />
        {textbookId && unitNumber !== null && (
          <>
            <WordList />

            <div className="border-t border-border pt-6">
              <h2 className="text-xl font-semibold">课文句子管理</h2>
            </div>
            <SentenceList />
          </>
        )}
      </div>
    </div>
  )
}
