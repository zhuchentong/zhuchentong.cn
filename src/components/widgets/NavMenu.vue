<script setup lang="ts">
import type { NavBarItem } from '@/config/header.config'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'

interface Props {
  items: NavBarItem[]
}

defineProps<Props>()
</script>

<template>
  <NavigationMenu class="flex-auto">
    <NavigationMenuList>
      <NavigationMenuItem v-for="item in items" :key="item.text">
        <template v-if="item.children?.length">
          <NavigationMenuTrigger>{{ item.text }}</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLink
              v-for="child in item.children"
              :key="child.text"
              :href="child.link"
              :class="navigationMenuTriggerStyle()"
            >
              {{ child.text }}
            </NavigationMenuLink>
          </NavigationMenuContent>
        </template>
        <template v-else>
          <NavigationMenuLink :href="item.link" :class="navigationMenuTriggerStyle()">
            {{ item.text }}
          </NavigationMenuLink>
        </template>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
</template>
