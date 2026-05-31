import { DEFAULT_MARGIN } from '@copybook/config'
import { copybookMargin } from '@copybook/store'
import { useStore } from '@nanostores/react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function MarginDialog({ open, onOpenChange }: Props) {
  const margin = useStore(copybookMargin)

  function update(key: 'top' | 'right' | 'bottom' | 'left', value: number) {
    copybookMargin.set({ ...margin, [key]: value })
  }

  function reset() {
    copybookMargin.set({ ...DEFAULT_MARGIN })
  }

  const sides = [
    { key: 'top' as const, label: '上边距' },
    { key: 'right' as const, label: '右边距' },
    { key: 'bottom' as const, label: '下边距' },
    { key: 'left' as const, label: '左边距' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>页边距设置</DialogTitle>
          <DialogDescription className="sr-only">调整页边距大小</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {sides.map(item => (
            <div key={item.key} className="flex gap-3 items-center">
              <span className="text-sm text-muted-foreground w-16">{item.label}</span>
              <Slider
                value={[margin[item.key]]}
                min={10}
                max={100}
                step={1}
                className="flex-1"
                onValueChange={([v]) => update(item.key, v)}
              />
              <span className="text-sm text-muted-foreground text-right w-12">
                {margin[item.key]}
                mm
              </span>
            </div>
          ))}
        </div>
        <DialogFooter className="flex-row justify-between">
          <Button variant="ghost" size="sm" onClick={reset}>
            重置
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
