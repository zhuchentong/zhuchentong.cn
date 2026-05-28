<script setup lang="ts">
import { useStore } from '@nanostores/vue'
import { ref, watch } from 'vue'
import { copybookText } from '@/stores/copybook.store'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const text = useStore(copybookText)
const localText = ref(text.value)

watch(() => props.visible, (val) => {
  if (val)
    localText.value = text.value
})

function confirm() {
  text.value = localText.value
  emit('close')
}

function cancel() {
  emit('close')
}

function onOverlayClick(e: MouseEvent) {
  if (e.target === e.currentTarget)
    cancel()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape')
    cancel()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="flex items-center inset-0 justify-center fixed z-50" @click="onOverlayClick" @keydown="onKeydown">
      <div class="bg-black/40 inset-0 absolute" />
      <div class="rounded-lg bg-white flex flex-col max-h-80vh w-480px shadow-xl relative" @click.stop>
        <div class="px-5 py-4 border-b border-gray-100">
          <h3 class="text-base text-gray-800 font-medium">
            输入汉字
          </h3>
        </div>
        <div class="p-5 flex-1 overflow-auto">
          <textarea
            v-model="localText"
            class="text-base p-3 border border-gray-200 rounded-md h-200px w-full resize-none focus:outline-none focus:border-blue-400"
            placeholder="请输入要练习的汉字"
            @keydown.escape.stop="cancel"
          />
        </div>
        <div class="px-5 py-3 border-t border-gray-100 flex gap-3 justify-end">
          <button class="text-sm text-gray-600 px-4 py-1.5 rounded-md hover:text-gray-800 hover:bg-gray-100" @click="cancel">
            取消
          </button>
          <button class="text-sm text-white px-4 py-1.5 rounded-md bg-blue-500 hover:bg-blue-600" @click="confirm">
            确定
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
