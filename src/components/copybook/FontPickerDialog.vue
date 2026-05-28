<script setup lang="ts">
import { useStore } from '@nanostores/vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FONT_FAMILIES } from '@/config/copybook.config'
import { copybookFontFamily } from '@/stores/copybook.store'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const fontFamily = useStore(copybookFontFamily)

function select(id: string) {
  fontFamily.value = id
  emit('close')
}

function getPreviewStyle(item: typeof FONT_FAMILIES[number]) {
  return {
    fontFamily: item.fallback,
  }
}
</script>

<template>
  <Dialog :open="visible" @update:open="emit('close')">
    <DialogContent class="sm:max-w-[360px]">
      <DialogHeader>
        <DialogTitle>选择字体</DialogTitle>
      </DialogHeader>
      <div class="space-y-1">
        <button
          v-for="item in FONT_FAMILIES"
          :key="item.id"
          class="px-4 py-3 text-left rounded-md flex w-full items-center justify-between hover:bg-accent transition-colors"
          :class="fontFamily === item.id ? 'bg-accent' : ''"
          @click="select(item.id)"
        >
          <span class="text-2xl" :style="getPreviewStyle(item)">{{ item.label }}</span>
          <span v-if="fontFamily === item.id" class="text-sm text-primary">✓</span>
        </button>
      </div>
    </DialogContent>
  </Dialog>
</template>
