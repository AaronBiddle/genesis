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
import { ref, onUnmounted } from 'vue';
import { addWindow } from '@/components/WindowSystem/WindowManager';
import { apps } from '@/components/WindowSystem/apps';
import eventBus from '@/components/WindowSystem/eventBus';

const content = ref('');
const props = defineProps<{
  windowData: {
    id: number;
    [key: string]: any;
  }
}>();

// Get the real window ID from the windowData prop
const windowId = props.windowData.id;

const handleFileManagerMessage = (senderId: number, message: { path: string, mode: string }) => {
  console.log(`DocumentEditor (${windowId}) received message from FileManager (${senderId}):`, message);
};

function openFileManager(mode: 'open' | 'save' | 'none') {
  const fileManagerApp = apps.find(app => app.id === 'file-manager');
  if (fileManagerApp) {
    eventBus.subscribe(windowId, handleFileManagerMessage);
    console.log(`DocumentEditor (${windowId}) subscribed to eventBus.`);

    addWindow(fileManagerApp, {
      parentId: windowId,
      launchOptions: { mode }
    });
  }
}

onUnmounted(() => {
  // Unsubscribe without the callback, force defaults to false
  eventBus.unsubscribe(windowId);
  console.log(`DocumentEditor (${windowId}) unsubscribed from eventBus.`);
});
</script>

<style scoped>
/* Add any component-specific styles here */
</style> 