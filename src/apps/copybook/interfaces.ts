export type GridType = 'tian' | 'mi' | 'huigong' | 'jiugong' | 'huitian' | 'huimi' | 'zuowen'

export interface Margin {
  top: number
  right: number
  bottom: number
  left: number
}

export interface CopybookState {
  text: string
  gridType: GridType
  gridSize: number
  rowGap: number
  margin: Margin
  fontFamily: string
  fontWeight: string
  fontSize: number
  fontOffsetY: number
  traceCount: number
  traceColor: string
  lineColor: string
  highlightFirst: boolean
  insertEmptyRow: boolean
  insertEmptyCol: boolean
}

export interface RenderParams {
  text: string
  gridType: GridType
  gridSize: number
  rowGap: number
  marginTop: number
  marginRight: number
  marginBottom: number
  marginLeft: number
  fontFamily: string
  fontWeight: string
  fontSize: number
  fontOffsetY: number
  traceCount: number
  traceColor: string
  lineColor: string
  highlightFirst: boolean
  insertEmptyRow: boolean
  insertEmptyCol: boolean
  paperWidth: number
  paperHeight: number
  startCharIndex?: number
}
