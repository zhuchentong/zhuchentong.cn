<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useIntervalFn } from '@vueuse/core'

const counter = ref(1)
useIntervalFn(() => {
  counter.value += 1
}, 1000, {
  immediate: true,
})

onMounted(() => {
})
</script>

<template>
  <div class="text-red">
    Counter: - {{ counter }}
  </div>
</template>
