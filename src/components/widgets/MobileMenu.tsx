import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

interface NavBarItem {
  text: string
  link?: string
  children?: NavBarItem[]
}

interface Props {
  items: NavBarItem[]
}

export default function MobileMenu({ items }: Props) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>菜单</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-2 p-4">
          {items.map(item => (
            <div key={item.text}>
              {item.link
                ? (
                    <a href={item.link} className="block px-3 py-2 rounded-md hover:bg-accent">
                      {item.text}
                    </a>
                  )
                : (
                    <div className="px-3 py-2 text-sm font-medium text-muted-foreground">
                      {item.text}
                    </div>
                  )}
              {item.children?.map(child => (
                <a
                  key={child.text}
                  href={child.link}
                  className="block px-6 py-2 rounded-md hover:bg-accent text-sm"
                >
                  {child.text}
                </a>
              ))}
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
