<template>
  <div class="p-4 bg-white h-full overflow-y-auto">
    <ul class="grid grid-cols-2 gap-x-4 gap-y-2">
      <li v-for="[id, iconHtml] in svgIcons" :key="id" class="flex items-center">
        <span class="icon-preview w-5 h-5 mr-3 flex items-center justify-center" v-html="iconHtml"></span>
        <span class="font-mono text-sm">{{ id }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { svgIcons } from '@/components/Icons/SvgIcons';
</script>

<style scoped>
.icon-preview :deep(svg) {
  width: 100%;
  height: 100%;
}
</style>

