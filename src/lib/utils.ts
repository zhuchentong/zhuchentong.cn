import type { ClassValue } from 'clsx'
import type { HTMLAttributes } from 'vue'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type ComputedClassValue = HTMLAttributes['class'] | undefined
