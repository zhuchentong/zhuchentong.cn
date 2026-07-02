import { Icon } from '@iconify/react'

/** "按任意键开始" 半透明遮罩，父组件按需条件渲染 */
export function StartOverlay() {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-xs">
      <div className="flex flex-col items-center gap-3">
        <Icon icon="icon-park-outline:keyboard-one" className="size-12 text-muted-foreground" />
        <p className="animate-pulse text-xl font-medium text-foreground">按任意键开始</p>
      </div>
    </div>
  )
}
