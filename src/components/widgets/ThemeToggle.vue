<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useStore } from '@nanostores/vue'
import * as AppStore from '../../stores/app.store'

const theme = useStore(AppStore.theme)

/**
 * 切换主题
 */
function onToggleTheme() {
  const value = theme.value === 'dark' ? 'light' : 'dark'
  AppStore.updateTheme(value)
}
</script>

<template>
  <div class="cursor-pointer" @click="onToggleTheme">
    <Icon v-if="theme === 'dark'" icon="icon-park-outline:moon" class="text-[16px]" />
    <Icon v-else icon="icon-park-outline:sun-one" class="text-[16px]" />
  </div>
</template>
