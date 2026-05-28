<script setup lang="ts">
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
</script>

<template>
  <Dialog :open="visible" @update:open="emit('close')">
    <DialogContent class="sm:max-w-[320px]">
      <DialogHeader>
        <DialogTitle>选择颜色</DialogTitle>
      </DialogHeader>
      <div class="space-y-3">
        <div v-for="group in COLOR_PALETTE" :key="group.name">
          <div class="flex gap-2">
            <button
              v-for="c in group.colors"
              :key="c"
              class="border-2 rounded-md size-9 transition-transform hover:scale-110"
              :style="{
                backgroundColor: c === 'black' ? '#000' : c,
                borderColor: color === c ? 'hsl(var(--primary))' : 'transparent',
              }"
              @click="selectColor(c)"
            />
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
