<script setup lang="ts">
import CanvasPreview from './CanvasPreview.vue'
import ControlPanel from './ControlPanel.vue'
</script>

<template>
  <div class="flex h-full overflow-hidden">
    <aside class="p-4 border-r border-gray-200 w-300px overflow-y-auto">
      <ControlPanel />
    </aside>
    <CanvasPreview />
  </div>
</template>
