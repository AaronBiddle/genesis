<template>
  <div class="p-2 h-full flex flex-col text-xs bg-gray-50 text-gray-800">
    <div class="overflow-y-auto border-b border-gray-300 pb-1 mb-1 flex-shrink-0">
      <!-- Header Row -->
      <div class="flex px-2 py-1 border-b border-gray-200 font-semibold text-gray-600">
        <span class="w-6 text-left mr-2">ID</span>
        <span class="w-12 text-left mr-5">ParentID</span>
        <span class="flex-grow text-left">Name</span>
      </div>
      <!-- Data Rows -->
      <div
        v-for="win in windows"
        :key="win.id"
        @click="selectedWindow = win"
        :class="[
          'flex cursor-pointer px-2 py-0.5 rounded hover:bg-blue-100',
          selectedWindow?.id === win.id ? 'bg-blue-200' : '',
        ]"
      >
        <span class="font-mono w-6 inline-block mr-2 text-left">{{ win.id }}</span>
        <span class="font-mono w-12 inline-block mr-5 text-left">{{ win.parentId ?? '' }}</span>
        <span class="flex-grow truncate">{{ win.title }}</span>
      </div>
    </div>

    <div class="flex-grow overflow-y-auto">
      <div v-if="selectedWindow" class="p-2 bg-white rounded border border-gray-200">
        <h3 class="font-semibold mb-1 border-b pb-0.5">{{ selectedWindow.title }} ({{ selectedWindow.id }})</h3>
        <dl class="grid grid-cols-2 gap-x-4 gap-y-0.5">
          <template v-for="(value, key) in selectedWindow" :key="key">
            <dt class="font-medium text-gray-600">{{ key }}:</dt>
            <dd class="font-mono break-all">{{ formatValue(value) }}</dd>
          </template>
        </dl>
      </div>
      <div v-else class="text-center text-gray-500 italic pt-4">
        Select a window above to see details.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { ManagedWindow } from './WindowManager'; // Corrected import path
import { windows as windowManagerWindows } from './WindowManager'; // Import the reactive windows state

// This component doesn't need the full manager, just the 'windows' reactive ref

const windows = windowManagerWindows; // Use the imported reactive ref directly
const selectedWindow = ref<ManagedWindow | null>(null);

const formatValue = (value: any): string => {
  if (typeof value === 'object' && value !== null) {
    try {
      return JSON.stringify(value);
    } catch (e) {
      return '[Object]';
    }
  }
    if (typeof value === 'function') {
        return '[Function]';
    }
  return String(value);
};

</script>

<style scoped>
/* Add any specific styles if needed */
dl {
  grid-template-columns: auto 1fr;
}
dt {
  white-space: nowrap;
}
</style> 