<template>
  <div class="p-2 h-full w-full flex flex-col">
    <textarea
      v-model="content"
      class="flex-grow w-full h-full p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
      placeholder="Start typing..."
    ></textarea>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const content = ref('');
</script>

<style scoped>
/* Add any component-specific styles here */
</style> 