export interface Question {
  words: string
  pinyin: string[]
  highlight?: boolean[]
}

export interface Margin {
  top: number
  right: number
  bottom: number
  left: number
}

export interface WorkbookRenderParams {
  questions: Question[]
  answerMode: 'all' | 'hide-keyword' | 'hidden'
  highlightEnabled: boolean
  highlightColor: string
  gridSize: number
  questionGap: number
  marginTop: number
  marginRight: number
  marginBottom: number
  marginLeft: number
  lineColor: string
  answerColor: string
  fontFamily: string
  fontWeight: string
  fontSize: number
  fontColor: string
  paperWidth: number
  paperHeight: number
  startQuestionIndex?: number
}

export interface WorkbookPageLayout {
  questionsPerPage: number
  totalPages: number
}
