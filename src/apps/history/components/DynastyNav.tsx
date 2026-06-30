import type { Dynasty } from '@history/interfaces'

export interface DynastyNavProps {
  dynasties: Dynasty[]
  onNavigate: (dynasty: Dynasty) => void
}

/**
 * 朝代导航条：从数据派生顶层朝代，点击即居中到该朝代（不改变缩放）
 */
export default function DynastyNav({ dynasties, onNavigate }: DynastyNavProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {dynasties.map(dynasty => (
        <button
          key={`${dynasty.name}-${dynasty.start}`}
          type="button"
          onClick={() => onNavigate(dynasty)}
          className="rounded-md bg-secondary px-2.5 py-1 text-xs text-secondary-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {dynasty.name}
        </button>
      ))}
    </div>
  )
}
