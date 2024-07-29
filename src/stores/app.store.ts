import { persistentAtom } from '@nanostores/persistent'

const theme = persistentAtom<'light' | 'dark'>('theme', 'light')
function updateTheme(value: 'light' | 'dark') {
  theme.set(value)
}

export {
  theme,
  updateTheme,
}
