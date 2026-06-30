import type { Country } from '../interfaces'
import { china } from './china'
import { egypt } from './egypt'
import { greece } from './greece'
import { india } from './india'
import { japan } from './japan'
import { mesopotamia } from './mesopotamia'
import { russia } from './russia'

/** 按国家在配色板中的位置循环分配强调色（用于车道标签的圆点） */
const raw: Country[] = [china, egypt, greece, india, japan, mesopotamia, russia]

export const ALL_COUNTRIES: Country[] = raw.map((country, i) => ({
  ...country,
  accent: `var(--dynasty-${i % 12})`,
}))
