<template>
  <div class="file-manager">
    <!-- Header -->
    <header class="file-manager-header">
      <h3>{{ modeTitle }}</h3>
      <div class="close-button" @click="emitCancel">×</div>
    </header>

    <!-- Mount Selection -->
    <section class="control-section">
      <label for="mount-select">Storage:</label>
      <select
        id="mount-select"
        v-model="selectedMount"
        @change="handleMountChange"
        class="mount-select"
      >
        <option v-for="mount in mounts" :key="mount.name" :value="mount.name">
          {{ mount.name }}
        </option>
      </select>
    </section>

    <!-- Path navigation + folder actions -->
    <section class="path-and-actions-container">
      <div class="path-navigation">
        <nav class="breadcrumbs">
          <span v-if="pathSegments.length === 0">&nbsp;</span>
          <span
            v-for="(segment, index) in pathSegments"
            :key="index"
            class="path-segment"
            @click="navigateToPathSegment(index)"
          >
            {{ segment || 'root' }}{{ index < pathSegments.length - 1 ? ' / ' : '' }}
          </span>
        </nav>
      </div>

      <button @click="navigateUp" :disabled="!currentPath" class="nav-button">Up</button>
      <button @click="showNewDirDialog = true" class="action-button">New Folder</button>
    </section>

    <!-- File list -->
    <section class="file-list-container">
      <div v-if="loading" class="loading">Loading...</div>
      <div v-else-if="error" class="error-message">{{ error }}</div>
      <div v-else-if="items.length === 0" class="empty-message">This folder is empty</div>
      <div v-else class="file-list">
        <div
          v-for="item in items"
          :key="item.name"
          :class="['file-item', { selected: selectedItem === item.name }]"
          @click="handleItemClick(item)"
          @dblclick="handleItemDoubleClick(item)"
        >
          <div class="file-icon">{{ item.isDirectory ? '📁' : '📄' }}</div>
          <div class="file-name">{{ item.name }}</div>
          <div class="file-actions">
            <button @click.stop="deleteItem(item)" class="delete-button">Delete</button>
          </div>
        </div>
      </div>
    </section>

    <!-- Bottom bar -->
    <section class="bottom-actions">
      <!-- Unified filename input for Open & Save modes -->
      <input
        v-if="effectiveMode !== 'none'"
        id="file-name-input"
        name="fileName"
        v-model="activeFileName"
        :placeholder="effectiveMode === 'open' ? 'Select or type filename to open' : 'Enter filename to save'"
        class="filename-input"
        @keyup.enter="effectiveMode === 'open' ? openActiveFile() : saveFile()"
      />

      <div class="spacer" />

      <button @click="emitCancel" class="cancel-button">Cancel</button>

      <button
        v-if="effectiveMode === 'open'"
        class="confirm-button"
        @click="openActiveFile"
        :disabled="!canOpenFile"
      >
        Open
      </button>

      <button
        v-if="effectiveMode === 'save'"
        class="confirm-button"
        @click="saveFile"
        :disabled="!activeFileName.trim()"
      >
        Save
      </button>
    </section>

    <!-- New directory dialog -->
    <div v-if="showNewDirDialog" class="dialog-overlay">
      <div class="dialog">
        <h4>Create New Folder</h4>
        <input
          v-model="newDirName"
          placeholder="Folder name"
          @keyup.enter="createNewDirectory"
        />
        <div class="dialog-buttons">
          <button @click="showNewDirDialog = false" class="cancel-button">Cancel</button>
          <button @click="createNewDirectory" class="confirm-button">Create</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, toRefs, computed, onMounted } from 'vue';
import {
  deleteFile,
  listDirectory,
  createDirectory,
  deleteDirectory,
  getMounts,
} from '@/services/HTTP/HttpFileClient';

/* *************************************************************
 * Types & constants
 ************************************************************ */
interface FileManagerOptions {
  /** Correlates dialog → promise resolution (injected by Window.vue). */
  token: number;
  mode: 'open' | 'save' | 'none';
  initialPath?: string;
  initialMount?: string;
  /** Pre-fills filename when mode === 'save'. */
  suggestedName?: string;
}

interface Props {
  getLaunchOptions: () => FileManagerOptions | undefined | null;
  sendParent: (message: any) => void;
  log: (namespace: string, message: string, isError?: boolean) => void;
}

const NS = 'FileManager.vue';

/* *************************************************************
 * Setup
 ************************************************************ */
const props = defineProps<Props>();
const emit = defineEmits<{ (event: 'close'): void }>();

const launchOptions = props.getLaunchOptions?.() ?? { mode: 'none', token: 0 };
const token = launchOptions.token;

/* Centralised reactive state */
const state = reactive({
  // UI state
  mounts: [] as Array<{ name: string; path: string }>,
  selectedMount: launchOptions.initialMount ?? 'userdata',

  currentPath: launchOptions.initialPath ?? '',
  items: [] as Array<{ name: string; isDirectory: boolean }>,
  selectedItem: null as string | null,

  loading: true,
  error: null as string | null,

  // Dialogs / inputs
  showNewDirDialog: false,
  newDirName: '',
  activeFileName: launchOptions.suggestedName ?? '',
});

/* Computed helpers */
const effectiveMode = computed<'open' | 'save' | 'none'>(() => launchOptions.mode ?? 'none');

const modeTitle = computed(() => {
  switch (effectiveMode.value) {
    case 'open':
      return 'Open File';
    case 'save':
      return 'Save File';
    default:
      return 'File Manager';
  }
});

const pathSegments = computed(() =>
  state.currentPath ? state.currentPath.split('/').filter(Boolean) : []
);

const canOpenFile = computed(() => {
  if (effectiveMode.value !== 'open' || !state.activeFileName.trim()) return false;
  const match = state.items.find((i) => i.name === state.activeFileName.trim());
  return !!match && !match.isDirectory;
});

/* *************************************************************
 * Navigation helpers
 ************************************************************ */
function navigateToPathSegment(index: number) {
  state.currentPath = pathSegments.value.slice(0, index + 1).join('/') as string;
  loadCurrentDirectory();
}

function navigateUp() {
  if (!state.currentPath) return;
  const segments = pathSegments.value;
  segments.pop();
  state.currentPath = segments.join('/');
  loadCurrentDirectory();
}

function handleMountChange() {
  state.currentPath = '';
  state.selectedItem = null;
  loadCurrentDirectory();
}

/* *************************************************************
 * CRUD helpers
 ************************************************************ */
async function loadMounts() {
  try {
    props.log(NS, 'Loading storage mounts.');
    const result = await getMounts();
    state.mounts = result;

    if (
      state.mounts.length > 0 &&
      !state.mounts.some((m) => m.name === state.selectedMount)
    ) {
      state.selectedMount = state.mounts[0].name;
    }
  } catch (err: any) {
    props.log(NS, `Error loading mounts: ${err?.message || err}`, true);
    state.error = err?.message || 'Failed to load storage mounts';
  }
}

async function loadCurrentDirectory() {
  if (!state.selectedMount) return;
  state.loading = true;
  state.error = null;
  try {
    props.log(NS, `Listing directory: Mount=${state.selectedMount}, Path='${state.currentPath}'`);
    const result = await listDirectory(state.selectedMount, state.currentPath);
    // Sort items: folders first, then alphabetically
    // Define a type for clarity
    interface DirectoryItem { name: string; isDirectory: boolean; }
    result.sort((a: DirectoryItem, b: DirectoryItem) => {
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1; // Directories come first
      }
      return a.name.localeCompare(b.name); // Then sort alphabetically
    });
    state.items = result.map((item: any) => ({
      name: item.name,
      isDirectory: item.isDirectory,
    }));
  } catch (err: any) {
    props.log(NS, `Error loading directory: ${err?.message || err}`, true);
    state.error = err?.message || 'Failed to load directory';
    state.items = [];
  } finally {
    state.loading = false;
  }
}

/* *************************************************************
 * UI event handlers
 ************************************************************ */
function handleItemClick(item: { name: string; isDirectory: boolean }) {
  state.selectedItem = item.name;

  if (item.isDirectory) {
    state.activeFileName = '';
    state.selectedItem = null;
    state.currentPath = state.currentPath ? `${state.currentPath}/${item.name}` : item.name;
    loadCurrentDirectory();
  } else {
    state.activeFileName = item.name;
  }
}

function handleItemDoubleClick(item: { name: string; isDirectory: boolean }) {
  if (effectiveMode.value === 'open' && !item.isDirectory) {
    openFile(item.name);
  }
}

async function createNewDirectory() {
  const name = state.newDirName.trim();
  if (!name || !state.selectedMount) return;

  const dirPath = state.currentPath ? `${state.currentPath}/${name}` : name;
  props.log(NS, `Creating directory: Mount=${state.selectedMount}, Path=${dirPath}`);

  try {
    await createDirectory(state.selectedMount, dirPath);
    state.newDirName = '';
    state.showNewDirDialog = false;
    await loadCurrentDirectory();
  } catch (err: any) {
    props.log(NS, `Error creating directory: ${err?.message || err}`, true);
    state.error = err?.message || 'Failed to create directory';
  }
}

async function deleteItem(item: { name: string; isDirectory: boolean }) {
  const fullPath = state.currentPath ? `${state.currentPath}/${item.name}` : item.name;
  if (!state.selectedMount) return;

  const confirmed = confirm(`Delete ${item.isDirectory ? 'folder' : 'file'} '${item.name}'?`);
  if (!confirmed) return;

  try {
    if (item.isDirectory) {
      await deleteDirectory(state.selectedMount, fullPath);
    } else {
      await deleteFile(state.selectedMount, fullPath);
    }
    await loadCurrentDirectory();
  } catch (err: any) {
    props.log(NS, `Error deleting: ${err?.message || err}`, true);
    state.error = err?.message || 'Failed to delete item';
  }
}

function openFile(fileName: string) {
  props.log(NS, `Opening file: ${fileName}`);
  props.sendParent({
    type: 'file',
    payload: {
      token,
      cancelled: false,
      mode: 'open',
      mount: state.selectedMount,
      path: state.currentPath,
      name: fileName,
    },
  });
  emit('close');
}

function openActiveFile() {
  if (canOpenFile.value) {
    openFile(state.activeFileName.trim());
  }
}

function saveFile() {
  const fileName = state.activeFileName.trim();
  if (!fileName) return;

  props.sendParent({
    type: 'file',
    payload: {
      token,
      cancelled: false,
      mode: 'save',
      mount: state.selectedMount,
      path: state.currentPath,
      name: fileName,
    },
  });
  emit('close');
}

function emitCancel() {
  props.log(NS, 'File manager closed (cancel).');
  props.sendParent({
    type: 'file',
    payload: { token, cancelled: true },
  });
  emit('close');
}

/* *************************************************************
 * Lifecycle
 ************************************************************ */
onMounted(async () => {
  await loadMounts();
  await loadCurrentDirectory();
});

/* *************************************************************
 * Expose state & helpers to template
 ************************************************************ */
const {
  mounts,
  selectedMount,
  currentPath,
  items,
  selectedItem,
  loading,
  error,
  showNewDirDialog,
  newDirName,
  activeFileName,
} = toRefs(state);
</script>

<style scoped>
/******************* core layout *******************/
.file-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f9f9f9;
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

/******************* controls *******************/
.control-section {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.mount-select {
  flex-grow: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

/******************* breadcrumbs & nav *******************/
.path-and-actions-container {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.path-navigation {
  flex: 1;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px;
}

.breadcrumbs {
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

.nav-button,
.action-button {
  padding: 8px 12px;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  flex-shrink: 0;
}

.nav-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/******************* file list *******************/
.file-list-container {
  flex: 1;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 12px;
  min-height: 0;
}

.loading,
.error-message,
.empty-message {
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
  background: #f5f5f5;
}

.file-item.selected {
  background: #e3f2fd;
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
  background: #f44336;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

/******************* bottom bar *******************/
.bottom-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filename-input {
  flex-grow: 1;
  padding: 6px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
  min-width: 100px;
}

.cancel-button,
.confirm-button {
  padding: 10px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.cancel-button {
  background: #f0f0f0;
  border: 1px solid #ddd;
  color: #333;
}

.confirm-button {
  background: #2188ff;
  border: 1px solid #2188ff;
  color: #fff;
}

.confirm-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/******************* dialogs *******************/
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  width: 300px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.dialog h4 {
  margin: 0 0 16px;
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
