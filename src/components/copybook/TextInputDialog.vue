<script setup lang="ts">
import { useStore } from '@nanostores/vue'
import { ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
</script>

<template>
  <Dialog :open="visible" @update:open="emit('close')">
    <DialogContent class="sm:max-w-[480px]">
      <DialogHeader>
        <DialogTitle>输入汉字</DialogTitle>
      </DialogHeader>
      <textarea
        v-model="localText"
        class="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder="请输入要练习的汉字"
      />
      <DialogFooter>
        <Button variant="outline" @click="emit('close')">
          取消
        </Button>
        <Button @click="confirm">
          确定
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
