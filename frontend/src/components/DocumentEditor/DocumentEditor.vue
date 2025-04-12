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

interface FileMessagePayload {
  mode: 'open' | 'save';
  mount: string;
  path: string;
  name?: string; // Present in 'open' mode
}

interface FileMessage {
  type: 'file';
  payload: FileMessagePayload;
}

const handleMessage = (senderId: number, message: FileMessage | any) => { // Allow 'any' for flexibility or future message types
  log(NS, `Received message from sender (${senderId}): ${JSON.stringify(message)}`);

  if (message.type === 'file') {
    const payload = message.payload as FileMessagePayload;
    const fullPath = payload.name ? `${payload.path}/${payload.name}` : payload.path;

    if (payload.mode === 'open') {
      // Placeholder: Log that we would load the file
      log(NS, `Received request to open: Mount=${payload.mount}, Path=${payload.path}, Name=${payload.name}. Full path: ${fullPath}`);
      // In a real scenario: fetch(fullPath).then(...) -> content.value = ...
    } else if (payload.mode === 'save') {
      // Placeholder: Log that we would save the file
      log(NS, `Received request to save to: Mount=${payload.mount}, Full Path=${payload.path}`);
      // In a real scenario: saveContentToFile(content.value, payload.path) ...
    }
  } else {
    log(NS, `Received unhandled message type: ${message.type ?? 'unknown'}`);
  }
};

function openFileManager(mode: 'open' | 'save' | 'none') {
  props.newWindow("file-manager", { mode });
}

// Expose the handleMessage function so Window.vue can access it
defineExpose({ handleMessage });

</script>