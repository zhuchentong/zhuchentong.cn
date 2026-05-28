<script setup lang="ts">
import { useStore } from '@nanostores/vue'
import { FONT_FAMILIES } from '@/config/copybook.config'
import { copybookFontFamily } from '@/stores/copybook.store'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const fontFamily = useStore(copybookFontFamily)

function select(cssVariable: string) {
  fontFamily.value = cssVariable
  emit('close')
}

function cancel() {
  emit('close')
}

function onOverlayClick(e: MouseEvent) {
  if (e.target === e.currentTarget)
    cancel()
}

function getPreviewStyle(item: typeof FONT_FAMILIES[number]) {
  return {
    fontFamily: `var(${item.cssVariable}), ${item.fallback}`,
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="flex items-center inset-0 justify-center fixed z-50" @click="onOverlayClick">
      <div class="bg-black/40 inset-0 absolute" />
      <div class="rounded-lg bg-white w-360px shadow-xl relative" @click.stop>
        <div class="px-5 py-4 border-b border-gray-100">
          <h3 class="text-base text-gray-800 font-medium">
            选择字体
          </h3>
        </div>
        <div class="p-3">
          <button
            v-for="item in FONT_FAMILIES"
            :key="item.cssVariable"
            class="px-4 py-3 text-left rounded-md flex w-full items-center justify-between hover:bg-gray-50"
            :class="fontFamily === item.cssVariable ? 'bg-blue-50' : ''"
            @click="select(item.cssVariable)"
          >
            <span class="text-2xl" :style="getPreviewStyle(item)">{{ item.label }}</span>
            <span v-if="fontFamily === item.cssVariable" class="text-sm text-blue-500">✓</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
