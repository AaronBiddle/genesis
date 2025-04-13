<template>
  <div class="p-2 pt-0 h-full w-full flex flex-col">
    <div class="toolbar flex items-center p-1 mb-0">
      <button class="p-1 hover:bg-gray-200 rounded" @click="createNewFile">
        <img src="@/components/Icons/icons8/icons8-new-file-80.png" alt="New File" class="h-6 w-6">
      </button>
      <button class="p-1 hover:bg-gray-200 rounded" @click="openFileManager('open')">
        <img src="@/components/Icons/icons8/icons8-open-file-80.png" alt="Open" class="h-6 w-6">
      </button>
      <button class="p-1 hover:bg-gray-200 rounded ml-1" @click="openFileManager('save')">
        <img src="@/components/Icons/icons8/icons8-save-80.png" alt="Save" class="h-6 w-6">
      </button>
      <button class="p-1 hover:bg-gray-200 rounded ml-1" @click="openFileManager('save')">
        <img src="@/components/Icons/icons8/icons8-save-as-80.png" alt="Save As" class="h-6 w-6">
      </button>

      <!-- Added Eye Toggle Button -->
      <button 
        class="p-1 hover:bg-gray-200 rounded ml-auto h-7 w-7 flex items-center justify-center" 
        :class="isPreviewActive ? 'text-blue-500' : 'text-gray-500'" 
        @click="togglePreview"
        v-html="eyeIconSvg"
      >
      </button>
    </div>
    <!-- Conditionally render textarea or Markdown preview -->
    <template v-if="!isPreviewActive">
      <textarea
        v-model="content"
        class="flex-grow w-full h-full border p-2 border-gray-300 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="Start typing..."
      ></textarea>
    </template>
    <template v-else>
      <div class="flex-grow w-full h-full border p-2 border-gray-300 overflow-y-auto">
        <MarkdownRenderer :source="content" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { log } from '@/components/Logger/loggerStore';
import { readFile, writeFile } from '@/services/FileClient';
import { svgIcons } from '@/components/Icons/SvgIcons'; // Import svgIcons
import MarkdownRenderer from '@/components/Markdown/MarkdownRenderer.vue'; // Import MarkdownRenderer

const props = defineProps<{
  newWindow: (appId: string, launchOptions?: any) => void;
}>();

const NS = 'DocumentEditor.vue';

const content = ref('');
const currentFilePath = ref<string | null>(null);
const currentFileMount = ref<string | null>(null);
const isPreviewActive = ref(false); // State for the preview toggle

// Get the eye icon SVG, remove fixed size/color classes for dynamic control
const eyeIconSvg = computed(() => {
  const rawSvg = svgIcons.get('eye') || '';
  // Remove the entire class attribute to allow dynamic styling via the button
  return rawSvg.replace(/ class=".*?"/, ''); 
});

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

const handleMessage = async (senderId: number, message: FileMessage | any) => {
  log(NS, `Received message from sender (${senderId}): ${JSON.stringify(message)}`);

  if (message.type === 'file') {
    const payload = message.payload as FileMessagePayload;

    if (payload.mode === 'open') {
      const fullPath = payload.name ? `${payload.path}/${payload.name}` : payload.path;
      log(NS, `Attempting to open: Mount=${payload.mount}, Path=${payload.path}, Name=${payload.name}. Full path: ${fullPath}`);
      try {
        const fileContent = await readFile(payload.mount, fullPath);
        log(NS, `Raw file content received: [${fileContent}]`);
        content.value = fileContent;
        currentFilePath.value = fullPath;
        currentFileMount.value = payload.mount;
        log(NS, `Successfully opened and read file: ${fullPath}`);
      } catch (error: any) {
        log(NS, `Error opening file ${fullPath}: ${error.message}`, true);
      }
    } else if (payload.mode === 'save') {
      const savePath = payload.path;
      log(NS, `Attempting to save content to: Mount=${payload.mount}, Path=${savePath}`);
      try {
        await writeFile(payload.mount, savePath, content.value);
        currentFilePath.value = savePath;
        currentFileMount.value = payload.mount;
        log(NS, `Successfully saved file to: ${savePath}`);
      } catch (error: any) {
        log(NS, `Error saving file to ${savePath}: ${error.message}`, true);
      }
    }
  } else {
    log(NS, `Received unhandled message type: ${message.type ?? 'unknown'}`);
  }
};

function openFileManager(mode: 'open' | 'save' | 'none') {
  props.newWindow("file-manager", { mode });
}

// Function to toggle the preview state
function togglePreview() {
  isPreviewActive.value = !isPreviewActive.value;
  log(NS, `Preview mode toggled: ${isPreviewActive.value}`);
  // Add logic here for what happens when preview is toggled on/off
}

function createNewFile() {
  content.value = '';
  currentFilePath.value = null;
  // Keep the currentFileMount.value as is for convenience
  log(NS, 'Created new file, cleared editor content');
}

// Expose the handleMessage function so Window.vue can access it
defineExpose({ handleMessage });

</script>