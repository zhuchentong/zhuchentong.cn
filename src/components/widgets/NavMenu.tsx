import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'

interface NavBarItem {
  text: string
  link?: string
  children?: NavBarItem[]
}

interface Props {
  items: NavBarItem[]
}

export default function NavMenu({ items }: Props) {
  return (
    <NavigationMenu className="flex-auto">
      <NavigationMenuList>
        {items.map(item => (
          <NavigationMenuItem key={item.text}>
            {item.children?.length
              ? (
                  <>
                    <NavigationMenuTrigger>{item.text}</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      {item.children.map(child => (
                        <NavigationMenuLink
                          key={child.text}
                          href={child.link}
                          className={navigationMenuTriggerStyle()}
                        >
                          {child.text}
                        </NavigationMenuLink>
                      ))}
                    </NavigationMenuContent>
                  </>
                )
              : (
                  <NavigationMenuLink href={item.link} className={navigationMenuTriggerStyle()}>
                    {item.text}
                  </NavigationMenuLink>
                )}
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  )
}
