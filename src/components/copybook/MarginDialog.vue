<script setup lang="ts">
import { useStore } from '@nanostores/vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
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
</script>

<template>
  <Dialog :open="visible" @update:open="emit('close')">
    <DialogContent class="sm:max-w-[400px]">
      <DialogHeader>
        <DialogTitle>页边距设置</DialogTitle>
      </DialogHeader>
      <div class="space-y-4">
        <div
          v-for="item in [
            { key: 'top' as const, label: '上边距' },
            { key: 'right' as const, label: '右边距' },
            { key: 'bottom' as const, label: '下边距' },
            { key: 'left' as const, label: '左边距' },
          ]" :key="item.key" class="flex gap-3 items-center"
        >
          <span class="text-sm text-muted-foreground w-16">{{ item.label }}</span>
          <Slider
            :model-value="[margin[item.key]]"
            :min="10"
            :max="100"
            :step="1"
            class="flex-1"
            @update:model-value="update(item.key, $event![0])"
          />
          <span class="text-sm text-muted-foreground text-right w-12">{{ margin[item.key] }}px</span>
        </div>
      </div>
      <DialogFooter class="flex-row justify-between">
        <Button variant="ghost" size="sm" @click="reset">
          重置
        </Button>
        <Button @click="emit('close')">
          确定
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
