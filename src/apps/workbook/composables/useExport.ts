import type { WorkbookRenderParams } from '../interfaces'
import { Leafer } from 'leafer-draw'
import { A4_HEIGHT_MM, A4_WIDTH_MM, EXPORT_DPI, MM_PER_INCH } from '../constants'
import { calcWorkbookPageLayout, createWorkbookElements } from './useRenderer'
import '@leafer-in/export'

function getRenderParamsList(params: WorkbookRenderParams): WorkbookRenderParams[] {
  const { questionsPerPage, totalPages } = calcWorkbookPageLayout({
    questionCount: params.questions.length,
    gridSize: params.gridSize,
    questionGap: params.questionGap,
    marginTop: params.marginTop,
    marginBottom: params.marginBottom,
    marginLeft: params.marginLeft,
    marginRight: params.marginRight,
    paperWidth: params.paperWidth,
    paperHeight: params.paperHeight,
    questions: params.questions,
  })
  const list: WorkbookRenderParams[] = []
  for (let page = 0; page < totalPages; page++) {
    list.push({ ...params, startQuestionIndex: page * questionsPerPage })
  }
  return list
}

function createExportLeafer(params: WorkbookRenderParams): Leafer {
  const exportWidth = Math.round(A4_WIDTH_MM * EXPORT_DPI / MM_PER_INCH)
  const exportHeight = Math.round(A4_HEIGHT_MM * EXPORT_DPI / MM_PER_INCH)
  const leafer = new Leafer({ width: exportWidth, height: exportHeight, pixelRatio: 1 })
  const pxPerMM = EXPORT_DPI / MM_PER_INCH
  const elements = createWorkbookElements(params, pxPerMM)
  elements.forEach(el => leafer.add(el))
  return leafer
}

export async function exportPNG(params: WorkbookRenderParams) {
  await document.fonts.ready
  const pages = getRenderParamsList(params)
  for (let i = 0; i < pages.length; i++) {
    const leafer = createExportLeafer(pages[i])
    const filename = pages.length === 1 ? 'pinyin-workbook.png' : `pinyin-workbook-${i + 1}.png`
    await leafer.export(filename, { pixelRatio: 1 })
    leafer.destroy()
  }
}

export async function exportPDF(params: WorkbookRenderParams) {
  await document.fonts.ready
  const { jsPDF } = await import('jspdf')
  const pages = getRenderParamsList(params)
  // eslint-disable-next-line new-cap
  const pdf = new jsPDF('p', 'mm', 'a4')
  for (let i = 0; i < pages.length; i++) {
    if (i > 0)
      pdf.addPage()
    const leafer = createExportLeafer(pages[i])
    const result = await leafer.export('png', { pixelRatio: 1 })
    pdf.addImage(result.data as string, 'PNG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM)
    leafer.destroy()
  }
  pdf.save('pinyin-workbook.pdf')
}
