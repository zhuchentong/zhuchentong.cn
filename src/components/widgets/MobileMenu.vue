<script setup lang="ts">
import type { NavBarItem } from '@/config/header.config'
import { Menu } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

interface Props {
  items: NavBarItem[]
}

defineProps<Props>()
</script>

<template>
  <Sheet>
    <SheetTrigger as-child>
      <Button variant="ghost" size="icon" class="md:hidden">
        <Menu class="size-5" />
      </Button>
    </SheetTrigger>
    <SheetContent side="left">
      <SheetHeader>
        <SheetTitle>菜单</SheetTitle>
      </SheetHeader>
      <nav class="flex flex-col gap-2 p-4">
        <template v-for="item in items" :key="item.text">
          <a
            v-if="item.link"
            :href="item.link"
            class="block px-3 py-2 rounded-md hover:bg-accent"
          >
            {{ item.text }}
          </a>
          <div v-else class="px-3 py-2 text-sm font-medium text-muted-foreground">
            {{ item.text }}
          </div>
          <a
            v-for="child in item.children"
            :key="child.text"
            :href="child.link"
            class="block px-6 py-2 rounded-md hover:bg-accent text-sm"
          >
            {{ child.text }}
          </a>
        </template>
      </nav>
    </SheetContent>
  </Sheet>
</template>
