import type { Country } from '@history/interfaces'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface CountrySelectorProps {
  countries: Country[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

/**
 * 国家 / 文明多选器：DropdownMenu + 复选项
 * 至少保留一个已选国家（取消最后一项时忽略）
 */
export default function CountrySelector({ countries, selectedIds, onChange }: CountrySelectorProps) {
  const toggle = (id: string, checked: boolean) => {
    if (!checked && selectedIds.length <= 1)
      return
    onChange(checked ? [...selectedIds, id] : selectedIds.filter(x => x !== id))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          选择文明
          <span className="ml-1.5 rounded bg-secondary px-1.5 text-xs tabular-nums">{selectedIds.length}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>文明 / 国家</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {countries.map(country => (
          <DropdownMenuCheckboxItem
            key={country.id}
            checked={selectedIds.includes(country.id)}
            onCheckedChange={checked => toggle(country.id, checked)}
          >
            <span
              className="mr-1.5 inline-block size-2 shrink-0 rounded-full"
              style={{ backgroundColor: country.accent }}
            />
            {country.name}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
