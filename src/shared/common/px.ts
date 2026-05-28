export function toPxString(value: number | string) {
  switch (true) {
    case typeof value === 'number':
    case typeof value === 'string' && !Number.isNaN(Number(value)):
      return `${value}px`
    case typeof value === 'string' && /\d+(?:\.\d+)?px/i.test(value):
      return value
    default:
      throw new Error(`[${value}] can't to transform px string!`)
  }
}
