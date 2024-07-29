<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useIntervalFn } from '@vueuse/core'

const a = ref(1)
useIntervalFn(() => {
  a.value += 1
}, 1000, {
  immediate: true,
})

onMounted(() => {
})
</script>

<template>
  <div class="text-red">
    2131- {{ a }}
  </div>
  <i class="icon-park-outline:delete" />
</template>
