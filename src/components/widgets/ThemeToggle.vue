
<script setup lang="ts">
import {onMounted, ref, watch} from 'vue'
import { useStore } from '@nanostores/vue'
import * as AppStore from '../../stores/app.store'
import { getCookie, setCookie } from '../../shared/common/cookies';

const props = defineProps<{
  value: 'light'|'dark'
}>()

const theme = ref<'dark'|'light'>(props.value)

// watch(theme, ()=>{
// })
/**
 * 切换主题
 */
function onToggleTheme(){
  const value = theme.value === 'dark'?'light':'dark'
  theme.value = value
  setCookie('theme',value)
  document.documentElement.classList.toggle('light')
  document.documentElement.classList.toggle('dark')
}

</script>

<template>
  <div class="cursor-pointer" @click="onToggleTheme">
    <i :class="{'dark-icon': theme === 'dark', 'light-icon': theme === 'light' }"></i>
  </div>
</template>

<style scoped>
.dark-icon{
  @apply icon-park-outline:moon;
}
.light-icon{
  @apply icon-park-outline:sun-one;
}
</style>