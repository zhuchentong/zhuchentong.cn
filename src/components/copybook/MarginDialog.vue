<script setup lang="ts">
import { useStore } from '@nanostores/vue'
import { DEFAULT_MARGIN } from '@/config/copybook.config'
import { copybookMargin } from '@/stores/copybook.store'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const margin = useStore(copybookMargin)

function update(key: 'top' | 'right' | 'bottom' | 'left', value: number) {
  margin.value = { ...margin.value, [key]: value }
}

function reset() {
  margin.value = { ...DEFAULT_MARGIN }
}

function cancel() {
  emit('close')
}

function onOverlayClick(e: MouseEvent) {
  if (e.target === e.currentTarget)
    cancel()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="flex items-center inset-0 justify-center fixed z-50" @click="onOverlayClick">
      <div class="bg-black/40 inset-0 absolute" />
      <div class="rounded-lg bg-white w-400px shadow-xl relative" @click.stop>
        <div class="px-5 py-4 border-b border-gray-100">
          <h3 class="text-base text-gray-800 font-medium">
            页边距设置
          </h3>
        </div>
        <div class="p-5 space-y-4">
          <div
            v-for="item in [
              { key: 'top' as const, label: '上边距' },
              { key: 'right' as const, label: '右边距' },
              { key: 'bottom' as const, label: '下边距' },
              { key: 'left' as const, label: '左边距' },
            ]" :key="item.key" class="flex gap-3 items-center"
          >
            <span class="text-sm text-gray-600 w-16">{{ item.label }}</span>
            <input
              type="range"
              :min="10"
              :max="100"
              :value="margin[item.key]"
              class="flex-1"
              @input="update(item.key, Number(($event.target as HTMLInputElement).value))"
            >
            <span class="text-sm text-gray-500 text-right w-12">{{ margin[item.key] }}px</span>
          </div>
        </div>
        <div class="px-5 py-3 border-t border-gray-100 flex justify-between">
          <button class="text-sm text-gray-500 px-3 py-1.5 rounded-md hover:text-gray-700 hover:bg-gray-100" @click="reset">
            重置
          </button>
          <button class="text-sm text-white px-4 py-1.5 rounded-md bg-blue-500 hover:bg-blue-600" @click="cancel">
            确定
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
