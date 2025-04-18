<template>
  <div class="file-manager">
    <div class="file-manager-header">
      <h3>{{ modeTitle }}</h3>
      <div class="close-button" @click="emitCancel">×</div>
    </div>

    <!-- Mount Selection -->
    <div class="control-section">
      <label for="mount-select">Storage:</label>
      <select id="mount-select" v-model="selectedMount" @change="handleMountChange" class="mount-select">
        <option v-for="mount in mounts" :key="mount.name" :value="mount.name">
          {{ mount.name }}
        </option>
      </select>
    </div>

    <!-- Current Path and Navigation -->
    <div class="path-and-actions-container">
      <div class="path-navigation">
        <div class="breadcrumbs">
          <span v-if="pathSegments.length === 0">&nbsp;</span>
          <span
            v-for="(segment, index) in pathSegments"
            :key="index"
            @click="navigateToPathSegment(index)"
            class="path-segment"
          >
            {{ segment || 'root' }}{{ index < pathSegments.length - 1 ? ' / ' : '' }}
          </span>
        </div>
      </div>
      <button @click="navigateUp" :disabled="currentPath === ''" class="nav-button">
        Up
      </button>
      <button @click="showNewDirDialog = true" class="action-button">New Folder</button>
    </div>

    <!-- File/Directory Actions -->
    <div class="action-buttons">
      <!-- Removed Save File button -->
    </div>

    <!-- File List -->
    <div class="file-list-container">
      <div v-if="loading" class="loading">Loading...</div>
      <div v-else-if="error" class="error-message">{{ error }}</div>
      <div v-else-if="items.length === 0" class="empty-message">This folder is empty</div>
      <div v-else class="file-list">
        <div 
          v-for="item in items" 
          :key="item.name" 
          @click="handleItemClick(item)"
          @dblclick="handleItemDoubleClick(item)"
          :class="['file-item', { 'selected': selectedItem === item.name }]"
        >
          <div class="file-icon">{{ item.isDirectory ? '📁' : '📄' }}</div>
          <div class="file-name">{{ item.name }}</div>
          <div class="file-actions">
            <button @click.stop="deleteItem(item)" class="delete-button">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Action Bar -->
    <div class="bottom-actions">
      <!-- Unified filename input for Open and Save modes -->
      <input 
        v-if="effectiveMode === 'open' || effectiveMode === 'save'"
        id="file-name-input" 
        name="fileName"
        v-model="activeFileName"
        :placeholder="effectiveMode === 'open' ? 'Select or type filename to open' : 'Enter filename to save'"
        class="filename-input"
        @keyup.enter="effectiveMode === 'open' ? openActiveFile() : saveFile()"
      />

      <div class="spacer"></div>
      <button @click="emitCancel" class="cancel-button">Cancel</button>
      
      <!-- Show Open button in Open mode -->
      <button 
        v-if="effectiveMode === 'open'" 
        @click="openActiveFile" 
        :disabled="!canOpenFile"
        class="confirm-button"
      >
        Open
      </button>

      <!-- Show Save button in Save mode -->
      <button
        v-if="effectiveMode === 'save'"
        @click="saveFile"
        :disabled="!activeFileName.trim()"
        class="confirm-button"
      >
        Save
      </button>

    </div>

    <!-- Restore New Directory Dialog -->
    <div v-if="showNewDirDialog" class="dialog-overlay">
      <div class="dialog">
        <h4>Create New Folder</h4>
        <input v-model="newDirName" placeholder="Folder name" @keyup.enter="createNewDirectory" />
        <div class="dialog-buttons">
          <button @click="showNewDirDialog = false" class="cancel-button">Cancel</button>
          <button @click="createNewDirectory" class="confirm-button">Create</button>
        </div>
      </div>
    </div>

    <!-- Removed Save Dialog -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import {
  deleteFile,
  listDirectory,
  createDirectory,
  deleteDirectory,
  getMounts,
} from '@/services/FileClient';

const NS = 'FileManager.vue';

// Define expected structure for launch options
interface FileManagerOptions {
  mode: 'open' | 'save' | 'none';
  initialPath?: string;
  initialMount?: string;
}

// Define props using TypeScript generic
interface Props {
  getLaunchOptions: () => FileManagerOptions | undefined | null;
  sendParent: (message: any) => void;
  log: (namespace: string, message: string, isError?: boolean) => void;
}

const props = defineProps<Props>();

// Define emits
const emit = defineEmits(['close']);

// Get launch options and set initial state
const launchOptions = props.getLaunchOptions() ?? { mode: 'none' }; // Default if options are null/undefined
const initialMode = launchOptions.mode ?? 'none';
const initialMountProp = launchOptions.initialMount ?? 'userdata';
const initialPathProp = launchOptions.initialPath ?? '';

// Reactive state
const mounts = ref<Array<{ name: string, path: string }>>([]);
const selectedMount = ref<string>(initialMountProp);
const currentPath = ref<string>(initialPathProp);
const items = ref<Array<{ name: string, isDirectory: boolean }>>([]);
const selectedItem = ref<string | null>(null);
const loading = ref<boolean>(true);
const error = ref<string | null>(null);
const showNewDirDialog = ref<boolean>(false);
const newDirName = ref<string>('');
const activeFileName = ref<string>('');

// Computed properties
const effectiveMode = computed<'open' | 'save' | 'none'>(() => {
  return initialMode; // Use the mode determined at launch
});

const modeTitle = computed(() => {
  switch (effectiveMode.value) {
    case 'open': return 'Open File';
    case 'save': return 'Save File';
    default: return 'File Manager';
  }
});

const pathSegments = computed(() => {
  if (!currentPath.value) return [];
  return currentPath.value.split('/').filter(segment => segment);
});

const canOpenFile = computed(() => {
  if (effectiveMode.value !== 'open' || !activeFileName.value.trim()) return false;
  const potentialMatch = items.value.find(item => item.name === activeFileName.value.trim());
  return potentialMatch && !potentialMatch.isDirectory;
});

// Methods for navigation
const navigateToPathSegment = (index: number) => {
  const newPath = pathSegments.value.slice(0, index + 1).join('/');
  currentPath.value = newPath;
  loadCurrentDirectory();
};

const navigateUp = () => {
  if (!currentPath.value) return;
  
  const segments = pathSegments.value;
  if (segments.length <= 1) {
    currentPath.value = '';
  } else {
    segments.pop();
    currentPath.value = segments.join('/');
  }
  
  loadCurrentDirectory();
};

const handleMountChange = () => {
  currentPath.value = '';
  selectedItem.value = null;
  loadCurrentDirectory();
};

// Methods for file/directory operations
const loadCurrentDirectory = async () => {
  if (!selectedMount.value) return;
  
  loading.value = true;
  error.value = null;
  selectedItem.value = null;
  
  try {
    props.log(NS, `Listing directory: Mount=${selectedMount.value}, Path='${currentPath.value}'`);
    const result = await listDirectory(selectedMount.value, currentPath.value);
    items.value = result.map((item: any) => ({
      name: item.name,
      isDirectory: item.isDirectory
    }));
  } catch (err: any) {
    props.log(NS, `Error loading directory: Mount=${selectedMount.value}, Path='${currentPath.value}', Error: ${err?.message || err}`, true);
    error.value = `Error: ${err.message || 'Failed to load directory'}`;
    items.value = [];
  } finally {
    loading.value = false;
  }
};

const loadMounts = async () => {
  try {
    props.log(NS, 'Loading storage mounts.');
    const result = await getMounts();
    mounts.value = result;
    
    // If initially selected mount doesn't exist, select the first available
    if (mounts.value.length > 0 && !mounts.value.some(m => m.name === selectedMount.value)) {
      selectedMount.value = mounts.value[0].name;
    }
  } catch (err: any) {
    props.log(NS, `Error loading mounts: ${err?.message || err}`, true);
    error.value = `Error: ${err.message || 'Failed to load storage mounts'}`;
  }
};

const handleItemClick = (item: { name: string, isDirectory: boolean }) => {
  selectedItem.value = item.name;
  if (item.isDirectory) {
    // Navigate into directory and clear filename input
    activeFileName.value = '';
    selectedItem.value = null;
    currentPath.value = currentPath.value 
      ? `${currentPath.value}/${item.name}` 
      : item.name;
    loadCurrentDirectory();
  } else {
    // For files (in any mode), select and populate the filename input
    activeFileName.value = item.name;
  }
};

const handleItemDoubleClick = (item: { name: string, isDirectory: boolean }) => {
  if (effectiveMode.value === 'open' && !item.isDirectory) {
    props.log(NS, `Double-clicked file '${item.name}', attempting to open.`);
    openFile(item.name);
  }
};

const createNewDirectory = async () => {
  const name = newDirName.value.trim();
  if (!name || !selectedMount.value) return;

  const dirPath = currentPath.value ? `${currentPath.value}/${name}` : name;
  props.log(NS, `Creating new directory: Mount=${selectedMount.value}, Path=${dirPath}`);
  try {
    await createDirectory(selectedMount.value, dirPath);
    newDirName.value = '';
    showNewDirDialog.value = false;
    await loadCurrentDirectory();
  } catch (err: any) {
    props.log(NS, `Error creating directory: Mount=${selectedMount.value}, Path=${dirPath}, Error: ${err?.message || err}`, true);
    error.value = `Error: ${err.message || 'Failed to create directory'}`;
    // Optionally, keep the dialog open or show error within it
  }
};

const deleteItem = async (item: { name: string, isDirectory: boolean }) => {
  const fullPath = currentPath.value ? `${currentPath.value}/${item.name}` : item.name;
  if (!selectedMount.value) return;

  const confirmation = confirm(`Are you sure you want to delete ${item.isDirectory ? 'folder' : 'file'} '${item.name}'?`);
  if (!confirmation) return;

  props.log(NS, `Attempting to delete: Mount=${selectedMount.value}, Path=${fullPath}, IsDirectory=${item.isDirectory}`);
  try {
    if (item.isDirectory) {
      await deleteDirectory(selectedMount.value, fullPath);
    } else {
      await deleteFile(selectedMount.value, fullPath);
    }
    props.log(NS, `Successfully deleted: Mount=${selectedMount.value}, Path=${fullPath}`);
    await loadCurrentDirectory();
  } catch (err: any) {
    props.log(NS, `Error deleting item: Mount=${selectedMount.value}, Path=${fullPath}, Error: ${err?.message || err}`, true);
    error.value = `Error: ${err.message || 'Failed to delete item'}`;
  }
};

const openFile = async (fileName: string) => {
  props.log(NS, `Attempting to open file: ${fileName} from path: ${currentPath.value} on mount: ${selectedMount.value}`);
  // Example using sendParent:
  props.sendParent({ 
    type: 'file', 
    payload: { mode: 'open', mount: selectedMount.value, path: currentPath.value, name: fileName }
  });

  emit('close'); // Close after sending
};

const openActiveFile = () => {
  if (canOpenFile.value) {
    openFile(activeFileName.value.trim());
  }
};

const saveFile = () => {
  const fileName = activeFileName.value.trim();
  if (!fileName) return;
  const directoryPath = currentPath.value;

  props.log(NS, `Sending 'save' message via sendParent: Mount=${selectedMount.value}, Path=${directoryPath}, Name=${fileName}`);
  props.sendParent({
    type: 'file', 
    payload: { 
      mode: 'save', 
      mount: selectedMount.value, 
      path: directoryPath,
      name: fileName
    }
  });
  emit('close'); // Close file manager after sending message
};

const emitCancel = () => {
  props.log(NS, 'File manager closed.');
  emit('close');
};

// Watch for changes
watch(effectiveMode, () => { // Watch the computed property directly
  // Reset state when mode changes
  selectedItem.value = null;
});

// Initialize component
onMounted(async () => {
  props.log(NS, `Component mounted. Mode: ${initialMode}, Initial Mount: ${initialMountProp}, Initial Path: '${initialPathProp}'`);
  await loadMounts();
  await loadCurrentDirectory();
});
</script>

<style scoped>
.file-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 16px;
  font-family: sans-serif;
}

.file-manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

.file-manager-header h3 {
  margin: 0;
  color: #333;
}

.close-button {
  cursor: pointer;
  font-size: 24px;
  color: #666;
}

.control-section {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.control-section label {
  margin-bottom: 0;
  font-weight: 500;
  color: #444;
  flex-shrink: 0;
}

.mount-select {
  flex-grow: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.path-and-actions-container {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.path-navigation {
  flex: 1;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px;
}

.breadcrumbs {
  flex: 1;
  overflow-x: auto;
  white-space: nowrap;
}

.path-segment {
  cursor: pointer;
  color: #2188ff;
}

.path-segment:hover {
  text-decoration: underline;
}

.nav-button {
  padding: 8px 12px;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  box-sizing: border-box;
  flex-shrink: 0;
}

.nav-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.action-button {
  padding: 8px 12px;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  box-sizing: border-box;
  flex-shrink: 0;
}

.action-button.primary {
  background-color: #2188ff;
  color: white;
  border-color: #2188ff;
}

.file-list-container {
  flex: 1;
  overflow-y: auto;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 12px;
  min-height: 0;
}

.loading, .error-message, .empty-message {
  padding: 16px;
  text-align: center;
  color: #666;
}

.error-message {
  color: #c62828;
}

.file-list {
  display: flex;
  flex-direction: column;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.file-item:hover {
  background-color: #f5f5f5;
}

.file-item.selected {
  background-color: #e3f2fd;
}

.file-icon {
  margin-right: 8px;
  font-size: 18px;
}

.file-name {
  flex: 1;
}

.file-actions {
  opacity: 0;
  transition: opacity 0.2s;
}

.file-item:hover .file-actions {
  opacity: 1;
}

.delete-button {
  padding: 4px 8px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.bottom-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.selected-file-display {
  color: #555;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
  min-width: 0;
}

.selected-file-display span {
  font-weight: bold;
  margin-left: 4px;
}

.spacer {
  flex-grow: 1;
}

.cancel-button, .confirm-button {
  padding: 10px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.cancel-button {
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  color: #333;
}

.confirm-button {
  background-color: #2188ff;
  border: 1px solid #2188ff;
  color: white;
}

.confirm-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Dialog styles */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog {
  background-color: white;
  border-radius: 8px;
  padding: 16px;
  width: 300px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.dialog h4 {
  margin-top: 0;
  margin-bottom: 16px;
  color: #333;
}

.dialog input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 16px;
  box-sizing: border-box;
}

.dialog-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* Style for the filename input in save mode */
.filename-input {
  flex-grow: 1; /* Allow input to take available space */
  padding: 6px 12px; /* Adjusted padding */
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px; /* Increased font size */
  min-width: 100px; /* Ensure it has some minimum width */
}
</style> 