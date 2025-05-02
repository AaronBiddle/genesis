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
        <span class="font-mono w-6 inline-block mr-2 text-right">{{ win.id }}</span>
        <span class="font-mono w-12 inline-block mr-5 text-right">{{ win.parentId ?? '' }}</span>
        <span class="flex-grow truncate text-left">{{ win.title }}</span>
      </div>
    </div>

    <div class="flex-grow overflow-y-auto">
      <div v-if="selectedWindow" class="p-2 bg-white rounded border border-gray-200">
        <h3 class="font-semibold mb-1 border-b pb-0.5">{{ selectedWindow.title }} ({{ selectedWindow.id }})</h3>
        <dl class="grid grid-cols-2 gap-x-4 gap-y-0.5">
          <template v-for="(value, key) in selectedWindow" :key="key">
            <dt class="font-medium text-gray-600">{{ key }}:</dt>
            <dd class="font-mono break-all">{{ formatValue(value, key) }}</dd>
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
import { inject, ref, watch } from 'vue'
import { windowStore as desktopWindowStore } from './windowStore'
import type { ManagedWindow } from './windowStore'

// pull the same instance that Desktop.vue provided
const injectedStore = inject<typeof desktopWindowStore>('windowStore')
if (!injectedStore) {
  throw new Error('WindowInspector requires an injected windowStore')
}

const windows = injectedStore.windows        // reactive Ref<ManagedWindow[]>
const selectedWindow = ref<ManagedWindow | null>(null)

watch(windows, newList => {
  const currentSelected = selectedWindow.value; // Store the current value
  if (currentSelected && !newList.some(w => w.id === currentSelected.id)) {
    selectedWindow.value = null
  }
})

function formatValue(value: unknown, key: string): string {
  if (key === 'appComponent') return (value as any)?.__name ?? '[Component]'
  if (typeof value === 'function') return '[Function]'
  if (typeof value === 'object' && value !== null) {
    try { return JSON.stringify(value) } catch { /* no-op */ }
    return '[Object]'
  }
  return String(value)
}
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