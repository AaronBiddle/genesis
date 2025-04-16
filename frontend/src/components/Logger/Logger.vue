<template>
  <div class="p-4 flex flex-col h-full bg-gray-50">
    <div class="mb-4 pb-2 border-b border-gray-300">
      <h3 class="text-lg font-semibold mb-2">Namespace Filters</h3>
      <div class="grid grid-cols-3 gap-2">
        <div v-for="ns in availableNamespaces" :key="ns" class="flex items-center">
          <input
            type="checkbox"
            :id="`ns-${ns}`"
            :checked="isNamespaceEnabled(ns)"
            @change="toggleNamespace(ns)"
            class="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label :for="`ns-${ns}`" class="text-sm text-gray-700">{{ ns }}</label>
        </div>
      </div>
      <div class="mt-2 space-x-2"> <button
          @click="clearLogs"
          class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
        >
          Clear Logs
        </button>
        <button
          @click="handleClearSettings"
          class="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs"
        >
          Reset Namespaces
        </button>
       </div>
    </div>

    <div class="flex-grow overflow-y-auto bg-white p-2 border border-gray-200 rounded shadow-inner" ref="logContainer">
      <div
        v-for="(logEntry, index) in filteredLogs"
        :key="logEntry.timestamp + '-' + index"
        :class="['text-xs font-mono mb-1 p-1 rounded', logEntry.isError ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800']"
      >
        <span class="font-semibold mr-2">
          [{{ logEntry.namespace }}{{ logEntry.windowId !== undefined ? ':' + logEntry.windowId : '' }}]
        </span>
        <span>{{ logEntry.message }}</span>
      </div>
       <div v-if="filteredLogs.length === 0" class="text-xs text-gray-500 italic">
         No logs to display for enabled namespaces.
       </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { useLogger } from './loggerStore';

const { availableNamespaces, filteredLogs, isNamespaceEnabled, toggleNamespace, clearLogs, clearNamespaceSettings } = useLogger();

const logContainer = ref<HTMLElement | null>(null);

// Wrapper function to potentially add confirmation later
const handleClearSettings = () => {
    // Optional: Add a confirmation dialog here if desired
    // if (confirm("Are you sure you want to reset all namespace settings?")) {
        clearNamespaceSettings();
    // }
};

// Scroll to bottom when new logs are added
watch(filteredLogs, async () => {
  await nextTick(); // Wait for the DOM to update
  if (logContainer.value) {
    logContainer.value.scrollTop = logContainer.value.scrollHeight;
  }
}, { deep: true }); // Deep watch needed as it's an array of objects

</script>

<style scoped>
/* Add any specific styles if needed */
</style> 