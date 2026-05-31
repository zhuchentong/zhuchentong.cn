import type { APIRoute } from 'astro'
import { ALLOWED_FONT_IDS } from '@copybook/config'
import { getFontSubsetBase64 } from '@copybook/server/font-subset-service'

const MAX_TEXT_LENGTH = 2000

export const GET: APIRoute = async ({ url }) => {
  const text = url.searchParams.get('text') || ''
  const fontId = url.searchParams.get('font') || 'mashanzheng'

  if (!text.trim()) {
    return new Response(JSON.stringify({ error: 'text is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return new Response(JSON.stringify({ error: `text too long (max ${MAX_TEXT_LENGTH})` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!ALLOWED_FONT_IDS.has(fontId)) {
    return new Response(JSON.stringify({ error: 'unsupported font' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const data = await getFontSubsetBase64(fontId, text)
    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  }
  catch (err: any) {
    console.error('Font subset error:', err)
    return new Response(JSON.stringify({ error: 'font subsetting failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
