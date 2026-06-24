import { Icon } from '@iconify/react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TextbookCoverManagerProps {
  textbookId: number
  initialCoverUrl: string | null
  onCoverUpdated: (newUrl: string) => void
}

export function TextbookCoverManager({ textbookId, initialCoverUrl, onCoverUpdated }: TextbookCoverManagerProps) {
  const [localCoverUrl, setLocalCoverUrl] = useState<string | null>(initialCoverUrl)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file)
      return

    const formData = new FormData()
    formData.append('cover', file)
    formData.append('textbookId', String(textbookId))

    setUploading(true)
    try {
      const res = await fetch('/english/api/textbooks/cover', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (!res.ok) {
        alert(json.error ?? '上传失败')
        return
      }
      const newUrl = json.data.coverUrl as string
      setLocalCoverUrl(newUrl)
      onCoverUpdated(newUrl)
    }
    catch {
      alert('上传失败')
    }
    finally {
      setUploading(false)
      if (fileInputRef.current)
        fileInputRef.current.value = ''
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>教材封面</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
            {localCoverUrl
              ? (
                  <img
                    src={localCoverUrl}
                    alt="教材封面"
                    className="size-full object-cover"
                  />
                )
              : (
                  <Icon icon="icon-park-outline:book-one" className="size-10 text-muted-foreground" />
                )}
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {localCoverUrl ? '点击替换封面图片' : '点击上传封面图片'}
            </p>
            <p className="text-xs text-muted-foreground">
              支持 JPG、PNG、WebP，最大 5MB
            </p>
            <Button
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? '上传中...' : localCoverUrl ? '替换封面' : '上传封面'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleUpload}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
