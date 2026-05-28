<script setup lang="ts">
import type { GridType } from '@/interfaces/copybook'
import { useStore } from '@nanostores/vue'
import { ref } from 'vue'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { FONT_WEIGHTS, GRID_TYPES } from '@/config/copybook.config'
import {
  copybookFontOffsetY,
  copybookFontSize,
  copybookFontWeight,
  copybookGridSize,
  copybookGridType,
  copybookHighlightFirst,
  copybookInsertEmptyCol,
  copybookInsertEmptyRow,
  copybookLineColor,
  copybookRowGap,
  copybookText,
  copybookTraceColor,
  copybookTraceCount,
} from '@/stores/copybook.store'
import ColorPickerDialog from './ColorPickerDialog.vue'
import ExportButton from './ExportButton.vue'
import FontPickerDialog from './FontPickerDialog.vue'
import MarginDialog from './MarginDialog.vue'
import TextInputDialog from './TextInputDialog.vue'

const text = useStore(copybookText)
const gridType = useStore(copybookGridType)
const gridSize = useStore(copybookGridSize)
const rowGap = useStore(copybookRowGap)
const fontWeight = useStore(copybookFontWeight)
const fontSize = useStore(copybookFontSize)
const fontOffsetY = useStore(copybookFontOffsetY)
const traceCount = useStore(copybookTraceCount)
const traceColor = useStore(copybookTraceColor)
const lineColor = useStore(copybookLineColor)
const highlightFirst = useStore(copybookHighlightFirst)
const insertEmptyRow = useStore(copybookInsertEmptyRow)
const insertEmptyCol = useStore(copybookInsertEmptyCol)

const showTextDialog = ref(false)
const showMarginDialog = ref(false)
const showFontDialog = ref(false)
const showTraceColorPicker = ref(false)
const showLineColorPicker = ref(false)
</script>

<template>
  <div class="text-sm flex flex-col gap-5">
    <section>
      <h4 class="text-xs text-gray-400 tracking-wider font-medium mb-2 uppercase">
        文本
      </h4>
      <button
        class="px-3 py-2 text-left border border-gray-200 rounded-md w-full truncate hover:border-gray-300"
        @click="showTextDialog = true"
      >
        {{ text || '点击输入汉字' }}
      </button>
    </section>

    <section>
      <h4 class="text-xs text-gray-400 tracking-wider font-medium mb-2 uppercase">
        显示
      </h4>
      <div class="space-y-2">
        <div class="flex gap-2 items-center">
          <Switch :model-value="highlightFirst" @update:model-value="copybookHighlightFirst.set($event)" />
          <Label>首字高亮</Label>
        </div>
        <div class="flex gap-2 items-center">
          <Switch :model-value="insertEmptyRow" @update:model-value="copybookInsertEmptyRow.set($event)" />
          <Label>插入空行</Label>
        </div>
        <div class="flex gap-2 items-center">
          <Switch :model-value="insertEmptyCol" @update:model-value="copybookInsertEmptyCol.set($event)" />
          <Label>插入空列</Label>
        </div>
      </div>
    </section>

    <section>
      <h4 class="text-xs text-gray-400 tracking-wider font-medium mb-2 uppercase">
        方格
      </h4>
      <div class="space-y-3">
        <div>
          <Label class="text-muted-foreground mb-1 block">方格类型</Label>
          <Select :model-value="gridType" @update:model-value="copybookGridType.set($event as GridType)">
            <SelectTrigger class="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="gt in GRID_TYPES" :key="gt.value" :value="gt.value">
                {{ gt.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <div class="text-muted-foreground mb-1 flex justify-between">
            <Label>方格大小</Label>
            <Label>{{ gridSize }}mm</Label>
          </div>
          <Slider :model-value="[gridSize]" :min="6" :max="60" :step="1" @update:model-value="copybookGridSize.set($event![0])" />
        </div>
        <div>
          <div class="text-muted-foreground mb-1 flex justify-between">
            <Label>行间距</Label>
            <Label>{{ rowGap }}mm</Label>
          </div>
          <Slider :model-value="[rowGap]" :min="0" :max="10" :step="1" @update:model-value="copybookRowGap.set($event![0])" />
        </div>
        <button
          class="px-3 py-1.5 text-left border border-gray-200 rounded-md w-full hover:bg-gray-50"
          @click="showMarginDialog = true"
        >
          页边距设置...
        </button>
      </div>
    </section>

    <section>
      <h4 class="text-xs text-gray-400 tracking-wider font-medium mb-2 uppercase">
        字体
      </h4>
      <div class="space-y-3">
        <button
          class="px-3 py-1.5 text-left border border-gray-200 rounded-md w-full hover:bg-gray-50"
          @click="showFontDialog = true"
        >
          字体选择...
        </button>
        <div>
          <Label class="text-muted-foreground mb-1 block">字体粗细</Label>
          <Select :model-value="fontWeight" @update:model-value="copybookFontWeight.set($event)">
            <SelectTrigger class="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="fw in FONT_WEIGHTS" :key="fw.value" :value="fw.value">
                {{ fw.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <div class="text-muted-foreground mb-1 flex justify-between">
            <Label>字体大小</Label>
            <Label>{{ fontSize }}%</Label>
          </div>
          <Slider :model-value="[fontSize]" :min="48" :max="128" :step="1" @update:model-value="copybookFontSize.set($event![0])" />
        </div>
        <div>
          <div class="text-muted-foreground mb-1 flex justify-between">
            <Label>上下偏移</Label>
            <Label>{{ fontOffsetY }}%</Label>
          </div>
          <Slider :model-value="[fontOffsetY]" :min="-50" :max="50" :step="1" @update:model-value="copybookFontOffsetY.set($event![0])" />
        </div>
      </div>
    </section>

    <section>
      <h4 class="text-xs text-gray-400 tracking-wider font-medium mb-2 uppercase">
        描红
      </h4>
      <div class="space-y-3">
        <div>
          <div class="text-muted-foreground mb-1 flex justify-between">
            <Label>描红数量</Label>
            <Label>{{ traceCount }}</Label>
          </div>
          <Slider :model-value="[traceCount]" :min="1" :max="20" :step="1" @update:model-value="copybookTraceCount.set($event![0])" />
        </div>
        <div class="flex gap-2 items-center">
          <Label class="text-muted-foreground">描红颜色</Label>
          <button
            class="border border-gray-200 rounded-md h-7 w-7"
            :style="{ backgroundColor: traceColor === 'black' ? '#000' : traceColor }"
            @click="showTraceColorPicker = true"
          />
        </div>
        <div class="flex gap-2 items-center">
          <Label class="text-muted-foreground">线条颜色</Label>
          <button
            class="border border-gray-200 rounded-md h-7 w-7"
            :style="{ backgroundColor: lineColor === 'black' ? '#000' : lineColor }"
            @click="showLineColorPicker = true"
          />
        </div>
      </div>
    </section>

    <section class="pt-2">
      <ExportButton />
    </section>

    <TextInputDialog v-model:visible="showTextDialog" />
    <MarginDialog v-model:visible="showMarginDialog" />
    <FontPickerDialog v-model:visible="showFontDialog" />
    <ColorPickerDialog
      :visible="showTraceColorPicker"
      :color="traceColor"
      @select="copybookTraceColor.set($event)"
      @close="showTraceColorPicker = false"
    />
    <ColorPickerDialog
      :visible="showLineColorPicker"
      :color="lineColor"
      @select="copybookLineColor.set($event)"
      @close="showLineColorPicker = false"
    />
  </div>
</template>
