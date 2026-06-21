/** 学段 */
export const STAGES = ['小学', '初中', '高中'] as const
export type Stage = typeof STAGES[number]

/** 常见出版社 */
export const PUBLISHERS = ['人教版', '外研版', '北师大版', '译林版'] as const

/** 学期 */
export const SEMESTERS = ['上', '下'] as const
