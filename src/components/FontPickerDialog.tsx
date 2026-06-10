import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FONT_FAMILIES, FONTS } from '@/config/font.config'

const previewFontCache = new Map<string, string>()

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: string
  onSelect: (id: string) => void
}

export default function FontPickerDialog({ open, onOpenChange, value, onSelect }: Props) {
  const [previewFonts, setPreviewFonts] = useState<Map<string, string>>(() => new Map(previewFontCache))

  useEffect(() => {
    let cancelled = false

    Promise.all(
      FONTS.map(async (font) => {
        if (previewFontCache.has(font.id))
          return
        try {
          const params = new URLSearchParams({ text: font.label, font: font.id })
          const res = await fetch(`/api/font-subset?${params}`)
          if (!res.ok)
            return
          const { data } = await res.json()
          if (cancelled)
            return
          const name = `FontPreview_${font.id}`
          const face = new FontFace(name, `url(${data})`)
          const loaded = await face.load()
          document.fonts.add(loaded)
          previewFontCache.set(font.id, name)
        }
        catch {}
      }),
    ).then(() => {
      if (!cancelled)
        setPreviewFonts(new Map(previewFontCache))
    })

    return () => {
      cancelled = true
    }
  }, [])

  function select(id: string) {
    onSelect(id)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle>选择字体</DialogTitle>
          <DialogDescription className="sr-only">选择字体</DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          {FONT_FAMILIES.map(item => (
            <button
              key={item.id}
              className={`px-4 py-3 text-left rounded-md flex w-full items-center justify-between hover:bg-accent transition-colors ${value === item.id ? 'bg-accent' : ''}`}
              onClick={() => select(item.id)}
            >
              <span className="text-2xl" style={{ fontFamily: `${previewFonts.get(item.id) ?? ''}, ${item.fallback}` }}>{item.label}</span>
              {value === item.id && <span className="text-sm text-primary">✓</span>}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
