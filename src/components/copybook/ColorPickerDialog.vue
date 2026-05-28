<script setup lang="ts">
import { COLOR_PALETTE } from '@/config/copybook.config'

defineProps<{
  visible: boolean
  color: string
}>()

const emit = defineEmits<{
  close: []
  select: [color: string]
}>()

function selectColor(color: string) {
  emit('select', color)
  emit('close')
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
      <div class="rounded-lg bg-white w-320px shadow-xl relative" @click.stop>
        <div class="px-5 py-4 border-b border-gray-100">
          <h3 class="text-base text-gray-800 font-medium">
            选择颜色
          </h3>
        </div>
        <div class="p-4">
          <div v-for="group in COLOR_PALETTE" :key="group.name" class="mb-3 last:mb-0">
            <div class="flex gap-2">
              <button
                v-for="c in group.colors"
                :key="c"
                class="border-2 rounded-md h-36px w-36px transition-transform hover:scale-110"
                :style="{
                  backgroundColor: c === 'black' ? '#000' : c,
                  borderColor: color === c ? '#3b82f6' : 'transparent',
                }"
                @click="selectColor(c)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
