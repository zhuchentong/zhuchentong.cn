import type { RenderParams } from '@/interfaces/copybook'
import { A4_HEIGHT_MM, A4_WIDTH_MM, EXPORT_DPI, MM_PER_INCH } from '@/shared/copybook/constants'
import { renderGrid } from './useGridRenderer'

function createExportCanvas(params: RenderParams): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(A4_WIDTH_MM * EXPORT_DPI / MM_PER_INCH)
  canvas.height = Math.round(A4_HEIGHT_MM * EXPORT_DPI / MM_PER_INCH)
  const ctx = canvas.getContext('2d')!
  const pxPerMM = EXPORT_DPI / MM_PER_INCH
  ctx.scale(pxPerMM, pxPerMM)
  renderGrid(ctx, params)
  return canvas
}

export function exportPNG(params: RenderParams) {
  const canvas = createExportCanvas(params)
  const link = document.createElement('a')
  link.download = 'copybook.png'
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export async function exportPDF(params: RenderParams) {
  const { jsPDF } = await import('jspdf')
  const canvas = createExportCanvas(params)
  const imgData = canvas.toDataURL('image/png')
  // eslint-disable-next-line new-cap
  const pdf = new jsPDF('p', 'mm', 'a4')
  pdf.addImage(imgData, 'PNG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM)
  pdf.save('copybook.pdf')
}
