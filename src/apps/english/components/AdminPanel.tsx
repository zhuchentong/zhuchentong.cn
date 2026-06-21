import { selectedTextbookId, selectedUnitNumber } from '@english/store'
import { useStore } from '@nanostores/react'

import { useState } from 'react'
import { AddSentenceForm, SentenceList } from './AddSentenceForm'
import { AddWordForm } from './AddWordForm'
import { TextbookUnitSelector } from './TextbookUnitSelector'
import { WordList, WordSearchPanel } from './WordList'

export function AdminPanel() {
  const textbookId = useStore(selectedTextbookId)
  const unitNumber = useStore(selectedUnitNumber)
  // 添加单词后递增 key 触发 WordList 重新拉取
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = () => setRefreshKey(k => k + 1)
  // 添加句子后递增 key 触发 SentenceList 重新拉取
  const [sentenceRefreshKey, setSentenceRefreshKey] = useState(0)
  const refreshSentence = () => setSentenceRefreshKey(k => k + 1)

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

            <div className="border-t border-border pt-6">
              <h2 className="text-xl font-semibold">课文句子管理</h2>
            </div>
            <AddSentenceForm onAdded={refreshSentence} />
            <SentenceList key={sentenceRefreshKey} refreshKey={sentenceRefreshKey} />
          </>
        )}
      </div>
    </div>
  )
}
