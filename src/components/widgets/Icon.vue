<script setup lang="ts">
import { Icon } from '@iconify/vue'

interface Props {
  icon: string
  class?: string
}

defineProps<Props>()
</script>

<template>
  <Icon :icon="icon" :class="class" />
</template>
