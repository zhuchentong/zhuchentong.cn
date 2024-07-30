<script setup lang="ts">
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
  <div class="cursor-pointer text-0" @click="onToggleTheme">
    <i class="text-16px" :class="{ 'dark-icon': theme === 'dark', 'light-icon': theme === 'light' }" />
  </div>
</template>

<style scoped>
.dark-icon {
  @apply icon-park-outline:moon;
}
.light-icon {
  @apply icon-park-outline:sun-one;
}
</style>
