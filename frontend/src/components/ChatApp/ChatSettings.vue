<template>
  <div class="p-4 flex flex-col h-full">
    <h2 class="text-lg font-semibold mb-4">Chat Settings</h2>

    <div class="mb-4 flex-grow">
      <label for="temperature" class="block text-sm font-medium text-gray-700 mb-1">Temperature:</label>
      <input
        id="temperature"
        type="number"
        v-model.number="temperature"
        step="0.1"
        min="0"
        max="2"
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
      />
      <p class="text-xs text-gray-500 mt-1">Controls randomness. Lower values are more deterministic. (0.0 - 2.0)</p>
    </div>

    <div class="mb-4 flex-grow flex flex-col">
       <label for="systemPrompt" class="block text-sm font-medium text-gray-700 mb-1">System Prompt:</label>
       <textarea
        id="systemPrompt"
        v-model="systemPrompt"
        rows="6"
        class="flex-grow w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm resize-none"
        placeholder="Enter instructions for the AI assistant..."
      ></textarea>
    </div>

    <div class="mt-auto flex justify-end space-x-2">
      <button
        @click="handleCancel"
        class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
      >
        Cancel
      </button>
      <button
        @click="handleOk"
        class="px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
      >
        OK
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const props = defineProps<{
  getLaunchOptions: () => any; // Function to get initial options
  sendParent: (message: any) => void; // Function to send data back to parent
}>();

const emit = defineEmits<{
  (e: 'close'): void; // Event to close the window
}>();

// Local state for settings
const temperature = ref<number>(0.7);
const systemPrompt = ref<string>('');

// Load initial settings when the component mounts
onMounted(() => {
  const options = props.getLaunchOptions();
  if (options) {
    temperature.value = options.initialTemperature ?? 0.7;
    systemPrompt.value = options.initialSystemPrompt ?? '';
    // Consider adding logging here if needed
  }
});

function handleCancel() {
  emit('close');
}

function handleOk() {
  const settingsPayload = {
    temperature: temperature.value,
    systemPrompt: systemPrompt.value,
  };
  props.sendParent({ type: 'settings', payload: settingsPayload });
  emit('close');
}
</script>

<style scoped>
/* Add any specific styles if needed */
</style> 