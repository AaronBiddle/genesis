<template>
  <div class="p-2 pt-0 h-full w-full flex flex-col">
    <!-- Toolbar -->
    <div class="toolbar flex items-center p-1 mb-0">
      <button class="p-1 hover:bg-gray-200 rounded" @click="createNewFile">
        <img src="@/components/Icons/icons8/icons8-new-file-80.png" alt="New File" class="h-6 w-6" />
      </button>

      <button class="p-1 hover:bg-gray-200 rounded" @click="openFileManager('open')">
        <img src="@/components/Icons/icons8/icons8-open-file-80.png" alt="Open" class="h-6 w-6" />
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
        />
      </button>

      <button class="p-1 hover:bg-gray-200 rounded ml-1" @click="openFileManager('save')">
        <img src="@/components/Icons/icons8/icons8-save-as-80.png" alt="Save As" class="h-6 w-6" />
      </button>

      <!-- Preview toggle -->
      <button
        class="p-1 hover:bg-gray-200 rounded ml-auto h-7 w-7 flex items-center justify-center"
        :class="isPreviewActive ? 'text-blue-500' : 'text-gray-500'"
        @click="togglePreview"
        v-html="eyeIconSvg"
      />
    </div>

    <!-- Editor / Preview -->
    <textarea
      v-if="!isPreviewActive"
      id="document-editor-textarea"
      v-model="content"
      class="flex-grow w-full h-full border p-2 border-gray-300 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
      placeholder="Start typing..."
    />
    <div
      v-else
      class="flex-grow w-full h-full border p-2 border-gray-300 overflow-y-auto"
    >
      <MarkdownRenderer :source="content" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { readFile, writeFile } from '@/services/HTTP/HttpFileClient';
import MarkdownRenderer from '@/components/Markdown/MarkdownRenderer.vue';
import { svgIcons } from '@/components/Icons/SvgIcons';

const NS = 'DocumentEditor.vue';

/* ------------------------------------------------------------------ *
 * Props / Emits
 * ------------------------------------------------------------------ */
interface NewWindowOptions {
  mode: 'open' | 'save' | 'none';
}
const props = defineProps<{
  newWindow: (appId: string, launchOptions?: NewWindowOptions) => void;
  log: (namespace: string, message: string, isError?: boolean) => void;
}>();

const emit = defineEmits<{
  (e: 'updateTitle', title: string): void;
}>();

/* ------------------------------------------------------------------ *
 * Reactive State
 * ------------------------------------------------------------------ */
const content = ref('');
const isPreviewActive = ref(false);
const hasUnsavedChanges = ref(false);
let isLoadingFile = false;

const currentFile = reactive<{
  dir: string | null;
  name: string | null;
  mount: string | null;
}>({
  dir: null,
  name: null,
  mount: null,
});

/* ------------------------------------------------------------------ *
 * Computed helpers
 * ------------------------------------------------------------------ */
const fullPath = computed(() =>
  currentFile.dir && currentFile.name
    ? `${currentFile.dir}/${currentFile.name}`.replace('//', '/')
    : null,
);

const isSaveDisabled = computed(() => !hasUnsavedChanges.value);

const eyeIconSvg = computed(() =>
  (svgIcons.get('eye') || '').replace(/ class=".*?"/, ''),
);

/* ------------------------------------------------------------------ *
 * Watchers
 * ------------------------------------------------------------------ */
watch(
  content,
  () => {
    if (!isLoadingFile) hasUnsavedChanges.value = true;
  },
  { flush: 'sync' },
);

/* ------------------------------------------------------------------ *
 * UI Actions
 * ------------------------------------------------------------------ */
function togglePreview() {
  isPreviewActive.value = !isPreviewActive.value;
  props.log(NS, `Preview mode: ${isPreviewActive.value}`);
}

function openFileManager(mode: 'open' | 'save' | 'none' = 'none') {
  props.newWindow('file-manager', { mode });
}

function createNewFile() {
  content.value = '';
  currentFile.name = null;
  hasUnsavedChanges.value = false;
  emit('updateTitle', 'New File - Document Editor');
}

/* ------------------------------------------------------------------ *
 * File helpers
 * ------------------------------------------------------------------ */
async function saveFile(path: string, mount: string) {
  await writeFile(mount, path, content.value);
  hasUnsavedChanges.value = false;
  emit('updateTitle', `${currentFile.name} - Document Editor`);
}

async function handleSaveClick() {
  if (fullPath.value && currentFile.mount) {
    try {
      await saveFile(fullPath.value, currentFile.mount);
      props.log(NS, `Saved to ${fullPath.value}`);
    } catch (e: any) {
      props.log(NS, `Save failed: ${e.message}`, true);
    }
  } else if (hasUnsavedChanges.value) {
    openFileManager('save');
  }
}

/* ------------------------------------------------------------------ *
 * Message Handling
 * ------------------------------------------------------------------ */
interface FileMessagePayload {
  mode: 'open' | 'save';
  mount: string;
  path: string;
  name?: string;
}
interface FileMessage {
  type: 'file';
  payload: FileMessagePayload;
}

async function openFile({ mount, path, name }: FileMessagePayload) {
  if (!name) return props.log(NS, 'Open message missing filename', true);
  const filePath = `${path}/${name}`;
  try {
    isLoadingFile = true;
    content.value = await readFile(mount, filePath);
    Object.assign(currentFile, { dir: path, name, mount });
    hasUnsavedChanges.value = false;
    emit('updateTitle', `${name} - Document Editor`);
    props.log(NS, `File opened: ${filePath}`);
  } catch (e: any) {
    props.log(NS, `Open failed: ${e.message}`, true);
  } finally {
    isLoadingFile = false;
  }
}

async function saveFileAs({ mount, path, name }: FileMessagePayload) {
  if (!name) return props.log(NS, 'Save message missing filename', true);
  const filePath = `${path}/${name}`;
  try {
    await saveFile(filePath, mount);
    Object.assign(currentFile, { dir: path, name, mount });
    props.log(NS, `File saved: ${filePath}`);
  } catch (e: any) {
    props.log(NS, `Save failed: ${e.message}`, true);
  }
}

function handleMessage(_senderId: number, message: FileMessage | any) {
  if (message.type !== 'file') {
    return props.log(NS, `Unhandled message type: ${message.type}`, true);
  }

  const { payload } = message;
  if (payload.mode === 'open') return openFile(payload);
  if (payload.mode === 'save') return saveFileAs(payload);
}

/* Expose API for parent Window.vue */
defineExpose({ handleMessage });

onMounted(() => emit('updateTitle', 'Document Editor'));
</script>

<style scoped>
.icon-disabled {
  filter: grayscale(1) opacity(0.9);
}
</style>
