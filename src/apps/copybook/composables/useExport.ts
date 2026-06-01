import type { RenderParams } from '@copybook/interfaces'
import { A4_HEIGHT_MM, A4_WIDTH_MM, EXPORT_DPI, MM_PER_INCH } from '@copybook/constants'
import { Leafer } from 'leafer-draw'
import { calcPageLayout, createGridElements } from './useGridRenderer'
import '@leafer-in/export'

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
    showPinyin: params.showPinyin,
  })

  const charsPerPage = params.insertEmptyRow ? Math.ceil(rowsPerPage / 2) : rowsPerPage
  const list: RenderParams[] = []
  for (let page = 0; page < totalPages; page++) {
    list.push({ ...params, startCharIndex: page * charsPerPage })
  }
  return list
}

/** 创建导出用的 Leafer 实例（离屏，固定 300 DPI） */
function createExportLeafer(params: RenderParams): Leafer {
  const exportWidth = Math.round(A4_WIDTH_MM * EXPORT_DPI / MM_PER_INCH)
  const exportHeight = Math.round(A4_HEIGHT_MM * EXPORT_DPI / MM_PER_INCH)

  const leafer = new Leafer({
    width: exportWidth,
    height: exportHeight,
    pixelRatio: 1,
  })

  const pxPerMM = EXPORT_DPI / MM_PER_INCH
  const elements = createGridElements(params, pxPerMM)

  elements.forEach((el) => {
    leafer.add(el)
  })

  return leafer
}

export async function exportPNG(params: RenderParams) {
  await document.fonts.ready
  const pages = getRenderParamsList(params)

  for (let index = 0; index < pages.length; index++) {
    const leafer = createExportLeafer(pages[index])
    const filename = pages.length === 1 ? 'copybook.png' : `copybook-${index + 1}.png`

    await leafer.export(filename, { pixelRatio: 1 })
    leafer.destroy()
  }
}

export async function exportPDF(params: RenderParams) {
  await document.fonts.ready
  const { jsPDF } = await import('jspdf')
  const pages = getRenderParamsList(params)
  // eslint-disable-next-line new-cap
  const pdf = new jsPDF('p', 'mm', 'a4')

  for (let index = 0; index < pages.length; index++) {
    if (index > 0)
      pdf.addPage()

    const leafer = createExportLeafer(pages[index])

    // 导出为 base64 数据
    const result = await leafer.export('png', { pixelRatio: 1 })
    const imgData = result.data as string

    pdf.addImage(imgData, 'PNG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM)
    leafer.destroy()
  }

  pdf.save('copybook.pdf')
}
