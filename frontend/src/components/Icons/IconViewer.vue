<template>
  <div class="icon-viewer p-4 bg-white h-full overflow-y-auto">
    <h2 class="text-lg font-semibold mb-3">Available Icons</h2>
    <ul class="space-y-2">
      <li v-for="[id, iconHtml] in svgIcons" :key="id" class="flex items-center border-b pb-1">
        <span class="icon-preview w-8 h-8 mr-3 flex items-center justify-center" v-html="iconHtml"></span>
        <span class="font-mono text-sm">{{ id }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { svgIcons } from '@/components/Icons/SvgIcons';
</script>

<style scoped>
.icon-viewer {
  /* Styles for the container if needed, ensures it fits within Window.vue */
  background-color: #f8f9fa; /* Light background */
}

.icon-preview :deep(svg) {
  /* Ensure SVG inherits size if not explicitly set */
  width: 1.25rem; /* Corresponds to w-5 */
  height: 1.25rem; /* Corresponds to h-5 */
}
</style> 