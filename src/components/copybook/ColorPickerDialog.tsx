import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { COLOR_PALETTE } from '@/config/copybook.config'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  color: string
  onSelect: (color: string) => void
}

export default function ColorPickerDialog({ open, onOpenChange, color, onSelect }: Props) {
  function selectColor(c: string) {
    onSelect(c)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[320px]">
        <DialogHeader>
          <DialogTitle>选择颜色</DialogTitle>
          <DialogDescription className="sr-only">选择描红颜色</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3">
          {COLOR_PALETTE.map(group => (
            <div key={group.name}>
              <div className="flex gap-2">
                {group.colors.map(c => (
                  <button
                    key={c}
                    className="border-2 rounded-md size-9 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c === 'black' ? '#000' : c,
                      borderColor: color === c ? 'hsl(var(--primary))' : 'transparent',
                    }}
                    onClick={() => selectColor(c)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
