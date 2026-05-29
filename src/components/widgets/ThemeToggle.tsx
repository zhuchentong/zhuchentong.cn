import { Icon } from '@iconify/react'
import { useStore } from '@nanostores/react'
import * as AppStore from '@/stores/app.store'

export default function ThemeToggle() {
  const theme = useStore(AppStore.theme)

  function onToggleTheme() {
    const value = theme === 'dark' ? 'light' : 'dark'
    AppStore.updateTheme(value)
  }

  return (
    <div className="cursor-pointer" onClick={onToggleTheme}>
      {theme === 'dark'
        ? <Icon icon="icon-park-outline:moon" className="text-[16px]" />
        : <Icon icon="icon-park-outline:sun-one" className="text-[16px]" />}
    </div>
  )
}
