import { useStore } from '@nanostores/react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { copybookText } from '@/stores/copybook.store'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function TextInputDialog({ open, onOpenChange }: Props) {
  const text = useStore(copybookText)
  const [localText, setLocalText] = useState(text)

  useEffect(() => {
    if (open)
      setLocalText(text) // eslint-disable-line react/set-state-in-effect -- intentional sync on dialog open
  }, [open, text])

  function confirm() {
    copybookText.set(localText)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>输入汉字</DialogTitle>
          <DialogDescription className="sr-only">输入要练习的汉字</DialogDescription>
        </DialogHeader>
        <textarea
          value={localText}
          onChange={e => setLocalText(e.target.value)}
          className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="请输入要练习的汉字"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={confirm}>
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
