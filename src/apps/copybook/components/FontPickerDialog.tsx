import { copybookFontFamily } from '@copybook/store'
import { useStore } from '@nanostores/react'
import FontPickerDialog from '@/components/FontPickerDialog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CopybookFontPickerDialog({ open, onOpenChange }: Props) {
  const fontFamily = useStore(copybookFontFamily)
  return (
    <FontPickerDialog
      open={open}
      onOpenChange={onOpenChange}
      value={fontFamily}
      onSelect={id => copybookFontFamily.set(id)}
    />
  )
}
