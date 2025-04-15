<template>
  <div class="p-4 bg-white h-full overflow-y-auto">
    <ul class="grid grid-cols-2 gap-4">
      <li v-for="[id, iconHtml] in svgIcons" :key="id" class="flex items-center pb-1">
        <span class="icon-preview w-8 h-8 mr-3 flex items-center justify-center" v-html="iconHtml"></span>
        <span class="font-mono text-sm">{{ id }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { svgIcons } from '@/components/Icons/SvgIcons';
</script>

