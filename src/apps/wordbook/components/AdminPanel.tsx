import { useStore } from '@nanostores/react'
import { selectedTextbookId, selectedUnitNumber } from '@wordbook/store'

import { useState } from 'react'
import { AddWordForm } from './AddWordForm'
import { TextbookUnitSelector } from './TextbookUnitSelector'
import { WordList, WordSearchPanel } from './WordList'

export function AdminPanel() {
  const textbookId = useStore(selectedTextbookId)
  const unitNumber = useStore(selectedUnitNumber)
  // 添加单词后递增 key 触发 WordList 重新拉取
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = () => setRefreshKey(k => k + 1)

  return (
    <div className="h-full overflow-auto bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-xl font-semibold">单词管理</h1>
        <TextbookUnitSelector />
        <WordSearchPanel />
        {textbookId && unitNumber !== null && (
          <>
            <AddWordForm onAdded={refresh} />
            <WordList key={refreshKey} />
          </>
        )}
      </div>
    </div>
  )
}
