<template>
  <div class="p-2 pt-0 h-full w-full flex flex-col">
    <div class="toolbar flex items-center p-1 mb-0">
      <button class="p-1 hover:bg-gray-200 rounded" @click="createNewFile">
        <img src="@/components/Icons/icons8/icons8-new-file-80.png" alt="New File" class="h-6 w-6">
      </button>
      <button class="p-1 hover:bg-gray-200 rounded" @click="openFileManager('open')">
        <img src="@/components/Icons/icons8/icons8-open-file-80.png" alt="Open" class="h-6 w-6">
      </button>
      <button 
        class="p-1 hover:bg-gray-200 rounded ml-1 disabled:opacity-50 disabled:hover:bg-transparent"
        @click="handleSaveClick"
        :disabled="isSaveDisabled"
      >
        <img 
          src="@/components/Icons/icons8/icons8-save-80.png" 
          alt="Save" 
          class="h-6 w-6"
          :class="{ 'icon-disabled': isSaveDisabled }"
        >
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
import { ref, computed, watch } from 'vue';
import { readFile, writeFile } from '@/services/FileClient';
import { svgIcons } from '@/components/Icons/SvgIcons'; // Import svgIcons
import MarkdownRenderer from '@/components/Markdown/MarkdownRenderer.vue'; // Import MarkdownRenderer

const props = defineProps<{
  newWindow: (appId: string, launchOptions?: any) => void;
  log: (namespace: string, message: string, isError?: boolean) => void;
}>();

const NS = 'DocumentEditor.vue';

let isLoadingFile = false; // Flag to prevent watcher during file load

const content = ref('');
const currentDirectoryPath = ref<string | null>(null);
const currentFileName = ref<string | null>(null);
const currentFileMount = ref<string | null>(null);
const isPreviewActive = ref(false); // State for the preview toggle
const hasUnsavedChanges = ref(false); // Track if content has been modified since last save

// Computed property to determine if the save button should be disabled
const isSaveDisabled = computed(() => {
  const dir = currentDirectoryPath.value;
  const name = currentFileName.value;
  const mount = currentFileMount.value;
  const changes = hasUnsavedChanges.value;
  // Check specifically for null/undefined for directory path
  const isDisabled = dir === null || !name || !mount || !changes; 
  props.log(NS, `isSaveDisabled check: Path='${dir}', Name='${name}', Mount='${mount}', Changes='${changes}' -> Disabled=${isDisabled}`);
  return isDisabled;
});

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
  props.log(NS, `Received message from sender (${senderId}): ${JSON.stringify(message)}`);

  if (message.type === 'file') {
    const payload = message.payload as FileMessagePayload;

    if (payload.mode === 'open') {
      // Use payload.path as directory and payload.name as filename
      const dirPath = payload.path;
      const fileName = payload.name;
      if (!fileName) {
          props.log(NS, `Error: Received 'open' message without a filename. Path: ${dirPath}`, true);
          // Decide how to handle this - maybe treat path as full path?
          // For now, we'll skip opening.
          return;
      }
      const fullPath = `${dirPath}/${fileName}`; // Reconstruct for logging/API call
      props.log(NS, `Attempting to open: Mount=${payload.mount}, Path=${dirPath}, Name=${fileName}. Full path: ${fullPath}`);
      try {
        props.log(NS, '[handleMessage:open] Fetching file content...');
        const fileContent = await readFile(payload.mount, fullPath);
        props.log(NS, `[handleMessage:open] Raw file content received: [${fileContent}]`);
        
        props.log(NS, '[handleMessage:open] Setting isLoadingFile = true');
        isLoadingFile = true;
        props.log(NS, `[handleMessage:open] isLoadingFile is now: ${isLoadingFile}`);
        
        props.log(NS, '[handleMessage:open] Assigning content.value...');
        content.value = fileContent; // This triggers the watcher
        props.log(NS, '[handleMessage:open] Assigned content.value.');
        
        // Update state *after* content assignment
        props.log(NS, '[handleMessage:open] Updating path/name/mount refs.');
        currentDirectoryPath.value = dirPath;
        currentFileName.value = fileName;
        currentFileMount.value = payload.mount;

        props.log(NS, '[handleMessage:open] Explicitly setting hasUnsavedChanges = false');
        hasUnsavedChanges.value = false;
        props.log(NS, `[handleMessage:open] hasUnsavedChanges is now: ${hasUnsavedChanges.value}`);
        
        props.log(NS, '[handleMessage:open] Resetting isLoadingFile = false');
        isLoadingFile = false;
        props.log(NS, `[handleMessage:open] isLoadingFile is now: ${isLoadingFile}`);

        props.log(NS, `[handleMessage:open] Successfully opened and read file: ${fullPath}`);
      } catch (error: any) {
        props.log(NS, `[handleMessage:open] Error opening file ${fullPath}: ${error.message}`, true);
        props.log(NS, '[handleMessage:open:error] Resetting isLoadingFile = false');
        isLoadingFile = false; // Ensure flag is reset on error too
      }
    } else if (payload.mode === 'save') {
      // payload.path is now the directory, payload.name is the filename
      const dirPath = payload.path;
      const fileName = payload.name;
      if (!fileName) {
          props.log(NS, `Error: Received 'save' message without a filename. Path: ${dirPath}`, true);
          return;
      }
      const saveFullPath = `${dirPath}/${fileName}`; // Reconstruct for API call and logging
      props.log(NS, `Attempting to save content via File Manager to: Mount=${payload.mount}, Path=${dirPath}, Name=${fileName}. Full Path=${saveFullPath}`);
      try {
        await writeFile(payload.mount, saveFullPath, content.value);
        // const { dir, name } = splitPath(saveFullPath); // No longer needed
        currentDirectoryPath.value = dirPath;   // Update directory from payload
        currentFileName.value = fileName;     // Update filename from payload
        currentFileMount.value = payload.mount; // Update mount
        hasUnsavedChanges.value = false;
        props.log(NS, `Successfully saved file to: ${saveFullPath}`);
      } catch (error: any) {
        props.log(NS, `Error saving file to ${saveFullPath}: ${error.message}`, true);
      }
    }
  } else {
    props.log(NS, `Received unhandled message type: ${message.type ?? 'unknown'}`);
  }
};

// Function to handle the Save button click
async function handleSaveClick() {
  // Check if all necessary parts are available, consistent with isSaveDisabled
  const dir = currentDirectoryPath.value;
  const name = currentFileName.value;
  const mount = currentFileMount.value;

  if (dir !== null && name && mount) { // Check dir !== null specifically
    // Reconstruct the full path for saving
    const fullPath = `${dir}/${name}`.replace('//', '/'); // Basic handling for potential double slash at root

    props.log(NS, `Attempting to save directly to: Mount=${mount}, Path=${fullPath}`);
    try {
      await writeFile(mount, fullPath, content.value);
      hasUnsavedChanges.value = false; // Reset unsaved changes after saving
      props.log(NS, `Successfully saved file directly to: ${fullPath}`);
    } catch (error: any) {
      props.log(NS, `Error saving file directly to ${fullPath}: ${error.message}`, true);
    }
  } else {
    // This block should ideally not be reachable if the button is enabled,
    // but keep the log/fallback just in case.
    props.log(NS, `Save clicked but state is invalid? Dir=${dir}, Name=${name}, Mount=${mount}. Opening save dialog.`);
    openFileManager('save');
  }
}

function openFileManager(mode: 'open' | 'save' | 'none') {
  props.newWindow("file-manager", { mode });
}

// Function to toggle the preview state
function togglePreview() {
  isPreviewActive.value = !isPreviewActive.value;
  props.log(NS, `Preview mode toggled: ${isPreviewActive.value}`);
  // Add logic here for what happens when preview is toggled on/off
}

function createNewFile() {
  content.value = '';
  currentFileName.value = null; // Reset filename only
  hasUnsavedChanges.value = false; // Reset unsaved changes when creating a new file
  // Keep currentDirectoryPath and currentFileMount to retain context
  props.log(NS, `Created new file, cleared editor content. Kept directory context: ${currentDirectoryPath.value} on mount ${currentFileMount.value}`);
}

// Watch for content changes
watch(content, (newValue, oldValue) => {
  props.log(NS, '[watch] Watcher triggered.');
  props.log(NS, `[watch] Checking isLoadingFile value: ${isLoadingFile}`);
  
  if (isLoadingFile) {
    props.log(NS, '[watch] isLoadingFile is true. Ignoring change for hasUnsavedChanges.');
    return; // Do nothing if we are loading a file
  }
  
  // Only set unsaved changes if it's a user edit
  props.log(NS, '[watch] isLoadingFile is false. Processing as user edit.');
  props.log(NS, `[watch] Content changed. Old length: ${oldValue?.length ?? 'undefined'}, New length: ${newValue?.length ?? 'undefined'}. Setting hasUnsavedChanges = true.`);
  hasUnsavedChanges.value = true;
  props.log(NS, `[watch] hasUnsavedChanges is now: ${hasUnsavedChanges.value}`);
}, { flush: 'sync' });

// Expose the handleMessage function so Window.vue can access it
defineExpose({ handleMessage });

</script>

<style scoped>
.icon-disabled {
  filter: grayscale(1) opacity(0.9);
}
</style>