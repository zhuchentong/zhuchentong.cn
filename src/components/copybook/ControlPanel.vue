<script setup lang="ts">
import { useStore } from '@nanostores/vue'
import { ref } from 'vue'
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
        <label class="flex gap-2 cursor-pointer items-center">
          <input
            type="checkbox"
            class="rounded"
            :checked="highlightFirst"
            @change="copybookHighlightFirst.set(($event.target as HTMLInputElement).checked)"
          >
          <span>首字高亮</span>
        </label>
        <label class="flex gap-2 cursor-pointer items-center">
          <input
            type="checkbox"
            class="rounded"
            :checked="insertEmptyRow"
            @change="copybookInsertEmptyRow.set(($event.target as HTMLInputElement).checked)"
          >
          <span>插入空行</span>
        </label>
        <label class="flex gap-2 cursor-pointer items-center">
          <input
            type="checkbox"
            class="rounded"
            :checked="insertEmptyCol"
            @change="copybookInsertEmptyCol.set(($event.target as HTMLInputElement).checked)"
          >
          <span>插入空列</span>
        </label>
      </div>
    </section>

    <section>
      <h4 class="text-xs text-gray-400 tracking-wider font-medium mb-2 uppercase">
        方格
      </h4>
      <div class="space-y-3">
        <div>
          <label class="text-gray-600 mb-1 block">方格类型</label>
          <select
            :value="gridType"
            class="text-sm px-3 py-1.5 border border-gray-200 rounded-md bg-white w-full"
            @change="copybookGridType.set(($event.target as HTMLSelectElement).value as any)"
          >
            <option v-for="gt in GRID_TYPES" :key="gt.value" :value="gt.value">
              {{ gt.label }}
            </option>
          </select>
        </div>
        <div>
          <div class="text-gray-600 mb-1 flex justify-between">
            <span>方格大小</span>
            <span>{{ gridSize }}mm</span>
          </div>
          <input
            type="range"
            :value="gridSize"
            :min="6"
            :max="60"
            :step="1"
            class="w-full"
            @input="copybookGridSize.set(Number(($event.target as HTMLInputElement).value))"
          >
        </div>
        <div>
          <div class="text-gray-600 mb-1 flex justify-between">
            <span>行间距</span>
            <span>{{ rowGap }}mm</span>
          </div>
          <input
            type="range"
            :value="rowGap"
            :min="0"
            :max="10"
            :step="1"
            class="w-full"
            @input="copybookRowGap.set(Number(($event.target as HTMLInputElement).value))"
          >
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
          <label class="text-gray-600 mb-1 block">字体粗细</label>
          <select
            :value="fontWeight"
            class="text-sm px-3 py-1.5 border border-gray-200 rounded-md bg-white w-full"
            @change="copybookFontWeight.set(($event.target as HTMLSelectElement).value)"
          >
            <option v-for="fw in FONT_WEIGHTS" :key="fw.value" :value="fw.value">
              {{ fw.label }}
            </option>
          </select>
        </div>
        <div>
          <div class="text-gray-600 mb-1 flex justify-between">
            <span>字体大小</span>
            <span>{{ fontSize }}%</span>
          </div>
          <input
            type="range"
            :value="fontSize"
            :min="48"
            :max="128"
            :step="1"
            class="w-full"
            @input="copybookFontSize.set(Number(($event.target as HTMLInputElement).value))"
          >
        </div>
        <div>
          <div class="text-gray-600 mb-1 flex justify-between">
            <span>上下偏移</span>
            <span>{{ fontOffsetY }}%</span>
          </div>
          <input
            type="range"
            :value="fontOffsetY"
            :min="-50"
            :max="50"
            :step="1"
            class="w-full"
            @input="copybookFontOffsetY.set(Number(($event.target as HTMLInputElement).value))"
          >
        </div>
      </div>
    </section>

    <section>
      <h4 class="text-xs text-gray-400 tracking-wider font-medium mb-2 uppercase">
        描红
      </h4>
      <div class="space-y-3">
        <div>
          <div class="text-gray-600 mb-1 flex justify-between">
            <span>描红数量</span>
            <span>{{ traceCount }}</span>
          </div>
          <input
            type="range"
            :value="traceCount"
            :min="1"
            :max="20"
            :step="1"
            class="w-full"
            @input="copybookTraceCount.set(Number(($event.target as HTMLInputElement).value))"
          >
        </div>
        <div class="flex gap-2 items-center">
          <span class="text-gray-600">描红颜色</span>
          <button
            class="border border-gray-200 rounded-md h-7 w-7"
            :style="{ backgroundColor: traceColor === 'black' ? '#000' : traceColor }"
            @click="showTraceColorPicker = true"
          />
        </div>
        <div class="flex gap-2 items-center">
          <span class="text-gray-600">线条颜色</span>
          <button
            class="border border-gray-200 rounded-md h-7 w-7"
            :style="{ backgroundColor: lineColor === 'black' ? '#000' : lineColor }"
            @click="showLineColorPicker = true"
          />
        </div>
      </div>
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
