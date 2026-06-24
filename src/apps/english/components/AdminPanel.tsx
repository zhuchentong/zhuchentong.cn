import { selectedTextbookId, selectedUnitNumber } from '@english/store'
import { useStore } from '@nanostores/react'

import { SentenceList } from './SentenceList'
import { TextbookUnitSelector } from './TextbookUnitSelector'
import { WordList, WordSearchPanel } from './WordList'

export function AdminPanel() {
  const textbookId = useStore(selectedTextbookId)
  const unitNumber = useStore(selectedUnitNumber)

  return (
    <div className="h-full overflow-auto bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-xl font-semibold">数据管理</h1>
        <TextbookUnitSelector />
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
