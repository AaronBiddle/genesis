<template>
  <div class="file-manager">
    <div class="file-manager-header">
      <h3>{{ modeTitle }}</h3>
      <div v-if="parentApplication" class="close-button" @click="emitCancel">×</div>
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
    <div class="path-navigation">
      <div class="breadcrumbs">
        <span 
          v-for="(segment, index) in pathSegments" 
          :key="index" 
          @click="navigateToPathSegment(index)" 
          class="path-segment"
        >
          {{ segment || 'root' }}{{ index < pathSegments.length - 1 ? ' / ' : '' }}
        </span>
      </div>
      <button @click="navigateUp" :disabled="currentPath === ''" class="nav-button">
        Up
      </button>
    </div>

    <!-- File/Directory Actions -->
    <div class="action-buttons">
      <button @click="showNewDirDialog = true" class="action-button">New Folder</button>
      <button v-if="mode === 'save'" @click="showSaveDialog = true" class="action-button primary">Save File</button>
    </div>

    <!-- New Directory Dialog -->
    <div v-if="showNewDirDialog" class="dialog-overlay">
      <div class="dialog">
        <h4>Create New Folder</h4>
        <input v-model="newDirName" placeholder="Folder name" @keyup.enter="createNewDirectory" />
        <div class="dialog-buttons">
          <button @click="showNewDirDialog = false; emitCancel()" class="cancel-button">Cancel</button>
          <button @click="createNewDirectory" class="confirm-button">Create</button>
        </div>
      </div>
    </div>

    <!-- Save Dialog (only in save mode) -->
    <div v-if="showSaveDialog" class="dialog-overlay">
      <div class="dialog">
        <h4>Save File</h4>
        <input v-model="saveFileName" placeholder="File name" @keyup.enter="saveFile" />
        <div class="dialog-buttons">
          <button @click="showSaveDialog = false; emitCancel()" class="cancel-button">Cancel</button>
          <button @click="saveFile" class="confirm-button">Save</button>
        </div>
      </div>
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
      <button @click="emitCancel" class="cancel-button">Cancel</button>
      <button 
        v-if="mode === 'open'" 
        @click="openSelectedFile" 
        :disabled="!canOpen"
        class="confirm-button"
      >
        Open
      </button>
    </div>
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

// Define props
const props = defineProps({
  mode: {
    type: String,
    default: 'none', // 'open', 'save', 'none'
    validator: (value: string) => ['open', 'save', 'none'].includes(value)
  },
  parentApplication: {
    type: Boolean,
    default: false
  },
  initialPath: {
    type: String,
    default: ''
  },
  initialMount: {
    type: String,
    default: 'userdata'
  }
});

// Define emits
const emit = defineEmits(['file-opened', 'file-saved', 'cancelled']);

// Reactive state
const mounts = ref<Array<{ name: string, path: string }>>([]);
const selectedMount = ref<string>(props.initialMount);
const currentPath = ref<string>(props.initialPath);
const items = ref<Array<{ name: string, isDirectory: boolean }>>([]);
const selectedItem = ref<string | null>(null);
const loading = ref<boolean>(true);
const error = ref<string | null>(null);
const showNewDirDialog = ref<boolean>(false);
const showSaveDialog = ref<boolean>(false);
const newDirName = ref<string>('');
const saveFileName = ref<string>('');

// Computed properties
const modeTitle = computed(() => {
  switch (props.mode) {
    case 'open': return 'Open File';
    case 'save': return 'Save File';
    default: return 'File Manager';
  }
});

const pathSegments = computed(() => {
  if (!currentPath.value) return [];
  return currentPath.value.split('/').filter(segment => segment);
});

const canOpen = computed(() => {
  if (props.mode !== 'open') return false;
  const selected = items.value.find(item => item.name === selectedItem.value);
  return selected && !selected.isDirectory;
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
    const result = await listDirectory(selectedMount.value, currentPath.value);
    items.value = result.map((item: any) => ({
      name: item.name,
      isDirectory: item.isDirectory
    }));
  } catch (err: any) {
    console.error('Error loading directory:', err);
    error.value = `Error: ${err.message || 'Failed to load directory'}`;
    items.value = [];
  } finally {
    loading.value = false;
  }
};

const loadMounts = async () => {
  try {
    const result = await getMounts();
    mounts.value = result;
    
    // If initially selected mount doesn't exist, select the first available
    if (mounts.value.length > 0 && !mounts.value.some(m => m.name === selectedMount.value)) {
      selectedMount.value = mounts.value[0].name;
    }
  } catch (err: any) {
    console.error('Error loading mounts:', err);
    error.value = `Error: ${err.message || 'Failed to load storage mounts'}`;
  }
};

const handleItemClick = (item: { name: string, isDirectory: boolean }) => {
  selectedItem.value = item.name;
  if (item.isDirectory) {
    // Navigate into directory on single click
    currentPath.value = currentPath.value 
      ? `${currentPath.value}/${item.name}` 
      : item.name;
    loadCurrentDirectory();
  }
};

const handleItemDoubleClick = (item: { name: string, isDirectory: boolean }) => {
  if (!item.isDirectory && props.mode === 'open') {
    // Open file directly on double-click if it's a file and in open mode
    openFile(item.name);
  }
};

const createNewDirectory = async () => {
  if (!newDirName.value.trim()) {
    error.value = 'Please enter a folder name';
    return;
  }
  
  const dirPath = currentPath.value 
    ? `${currentPath.value}/${newDirName.value}` 
    : newDirName.value;
  
  try {
    await createDirectory(selectedMount.value, dirPath);
    showNewDirDialog.value = false;
    newDirName.value = '';
    loadCurrentDirectory();
  } catch (err: any) {
    error.value = `Failed to create folder: ${err.message}`;
  }
};

const deleteItem = async (item: { name: string, isDirectory: boolean }) => {
  if (!confirm(`Are you sure you want to delete ${item.name}?`)) {
    return;
  }
  
  const path = currentPath.value 
    ? `${currentPath.value}/${item.name}` 
    : item.name;
  
  try {
    if (item.isDirectory) {
      await deleteDirectory(selectedMount.value, path);
    } else {
      await deleteFile(selectedMount.value, path);
    }
    loadCurrentDirectory();
  } catch (err: any) {
    error.value = `Failed to delete: ${err.message}`;
  }
};

const openFile = async (fileName: string) => {
  console.log('openFile called with fileName:', fileName);
};

const openSelectedFile = () => {
  if (selectedItem.value) {
    const selected = items.value.find(item => item.name === selectedItem.value);
    if (selected && !selected.isDirectory) {
      openFile(selectedItem.value);
    }
  }
};

const saveFile = async () => {
  console.log('saveFile called');
};

const emitCancel = () => {
  emit('cancelled');
};

// Watch for changes
watch(() => props.mode, () => {
  // Reset state when mode changes
  selectedItem.value = null;
});

// Initialize component
onMounted(async () => {
  await loadMounts();
  loadCurrentDirectory();
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

.path-navigation {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
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
  margin-left: 8px;
  padding: 4px 8px;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
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
  justify-content: space-between;
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
</style> 