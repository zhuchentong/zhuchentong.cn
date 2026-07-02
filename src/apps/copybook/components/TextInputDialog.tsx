import { copybookText } from '@copybook/store'
import { useStore } from '@nanostores/react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import TextbookPickerDialog from './TextbookPickerDialog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function TextInputDialog({ open, onOpenChange }: Props) {
  const text = useStore(copybookText)
  const [localText, setLocalText] = useState(text)
  const [showPicker, setShowPicker] = useState(false)

  useEffect(() => {
    if (open)
      setLocalText(text) // eslint-disable-line react/set-state-in-effect -- intentional sync on dialog open
  }, [open, text])

  function confirm() {
    copybookText.set(localText)
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
        <DialogContent
          className="sm:max-w-[480px]"
          onInteractOutside={(e) => {
            // 教材选择 overlay 打开时，点击它不应关闭本弹窗
            if (showPicker)
              e.preventDefault()
          }}
        >
          <DialogHeader>
            <DialogTitle>输入汉字</DialogTitle>
            <DialogDescription className="sr-only">输入要练习的汉字</DialogDescription>
          </DialogHeader>
          <textarea
            value={localText}
            onChange={e => setLocalText(e.target.value)}
            className="min-h-[200px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:outline-none focus:ring-ring"
            placeholder="请输入要练习的汉字"
          />
          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={() => setShowPicker(true)}>
              导入教材
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button onClick={confirm}>
                确定
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 独立弹窗：必须与上方 Dialog 平级，避免 Radix 嵌套 Dialog 相互干扰 open 状态 */}
      <TextbookPickerDialog
        open={showPicker}
        onOpenChange={setShowPicker}
        onImport={setLocalText}
      />
    </>
  )
}
