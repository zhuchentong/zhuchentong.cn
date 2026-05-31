import type { RenderParams } from '@copybook/interfaces'
import { A4_HEIGHT_MM, A4_WIDTH_MM, EXPORT_DPI, MM_PER_INCH } from '@copybook/constants'
import { calcPageLayout, renderGrid } from './useGridRenderer'

function createExportCanvas(params: RenderParams): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(A4_WIDTH_MM * EXPORT_DPI / MM_PER_INCH)
  canvas.height = Math.round(A4_HEIGHT_MM * EXPORT_DPI / MM_PER_INCH)
  const ctx = canvas.getContext('2d')!
  const pxPerMM = EXPORT_DPI / MM_PER_INCH
  ctx.scale(pxPerMM, pxPerMM)
  renderGrid(ctx, { ...params })
  return canvas
}

function getRenderParamsList(params: RenderParams): RenderParams[] {
  const chars = Array.from(params.text)
  const { rowsPerPage, totalPages } = calcPageLayout({
    charCount: chars.length,
    gridSize: params.gridSize,
    rowGap: params.rowGap,
    marginTop: params.marginTop,
    marginBottom: params.marginBottom,
    paperHeight: params.paperHeight,
    insertEmptyRow: params.insertEmptyRow,
  })

  const charsPerPage = params.insertEmptyRow ? Math.ceil(rowsPerPage / 2) : rowsPerPage
  const list: RenderParams[] = []
  for (let page = 0; page < totalPages; page++) {
    list.push({ ...params, startCharIndex: page * charsPerPage })
  }
  return list
}

export async function exportPNG(params: RenderParams) {
  await document.fonts.ready
  const pages = getRenderParamsList(params)
  pages.forEach((pageParams, index) => {
    const canvas = createExportCanvas(pageParams)
    const link = document.createElement('a')
    link.download = pages.length === 1 ? 'copybook.png' : `copybook-${index + 1}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  })
}

export async function exportPDF(params: RenderParams) {
  await document.fonts.ready
  const { jsPDF } = await import('jspdf')
  const pages = getRenderParamsList(params)
  // eslint-disable-next-line new-cap
  const pdf = new jsPDF('p', 'mm', 'a4')

  pages.forEach((pageParams, index) => {
    if (index > 0)
      pdf.addPage()
    const canvas = createExportCanvas(pageParams)
    const imgData = canvas.toDataURL('image/png')
    pdf.addImage(imgData, 'PNG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM)
  })

  pdf.save('copybook.pdf')
}
