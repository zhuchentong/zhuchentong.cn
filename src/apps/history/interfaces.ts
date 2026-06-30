/**
 * 朝代树节点，与参考项目 period.json 同构
 * 年份为负数表示公元前，0 表示公元元年
 */
export interface Dynasty {
  name: string
  start: number
  end: number
  child?: Dynasty[]
  /** 预留：朝代类型，用于后期按语义配色 */
  type?: 'unified' | 'divided' | 'foreign' | 'republic'
}

/**
 * 一个国家 / 文明的朝代数据
 * 多国并列时，每个国家渲染为时间轴上的一条独立车道，共享同一条 x 轴
 */
export interface Country {
  id: string
  name: string
  dynasties: Dynasty[]
  /** 预留：多国并列时的强调色键 */
  accent?: string
}
