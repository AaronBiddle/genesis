<template>
  <div class="p-2 pt-0 h-full w-full flex flex-col">
    <div class="toolbar flex items-center p-1 mb-0">
      <button class="p-1 hover:bg-gray-200 rounded" @click="openFileManager('open')">
        <img src="@/components/Icons/icons8/icons8-open-file-80.png" alt="Open" class="h-6 w-6">
      </button>
      <button class="p-1 hover:bg-gray-200 rounded ml-1" @click="openFileManager('save')">
        <img src="@/components/Icons/icons8/icons8-save-80.png" alt="Save" class="h-6 w-6">
      </button>
      <button class="p-1 hover:bg-gray-200 rounded ml-1" @click="openFileManager('save')">
        <img src="@/components/Icons/icons8/icons8-save-as-80.png" alt="Save As" class="h-6 w-6">
      </button>
    </div>
    <textarea
      v-model="content"
      class="flex-grow w-full h-full border p-2 border-gray-300 rounded resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
      placeholder="Start typing..."
    ></textarea>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { log } from '@/components/Logger/loggerStore';

const props = defineProps<{
  newWindow: (appId: string, launchOptions?: any) => void;
}>();

const NS = 'DocumentEditor.vue';

const content = ref('');

const handleMessage = (senderId: number, message: { path: string, mode: string }) => {
  log(NS, `Received message from sender (${senderId}): ${JSON.stringify(message)}`);
  // Add logic here based on the message, e.g., load file content if message.path exists
  if (message.path && message.mode === 'open') {
    // Placeholder: Log that we would load the file
    log(NS, `Received path to open: ${message.path}`);
    // In a real scenario: fetch(message.path).then(...) -> content.value = ...
  } else if (message.mode === 'save') {
    // Placeholder: Log that we would save the file
    log(NS, `Received request to save to: ${message.path ?? 'path not provided'}`);
    // In a real scenario: saveContentToFile(content.value, message.path) ...
  }
};

function openFileManager(mode: 'open' | 'save' | 'none') {
  props.newWindow("file-manager", { mode });
}

// Expose the handleMessage function so Window.vue can access it
defineExpose({ handleMessage });

</script>