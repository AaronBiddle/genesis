<template>
  <div class="p-2 pt-0 h-full w-full flex flex-col">
    <!-- Toolbar -->
    <div class="toolbar flex items-center p-1 mb-0">
      <!-- New -->
      <button class="p-1 hover:bg-gray-200 rounded" @click="createNewFile">
        <img src="@/components/Icons/icons8/icons8-new-file-80.png" alt="New File" class="h-6 w-6" />
      </button>

      <!-- Open -->
      <button class="p-1 hover:bg-gray-200 rounded" @click="openFileDialog">
        <img src="@/components/Icons/icons8/icons8-open-file-80.png" alt="Open" class="h-6 w-6" />
      </button>

      <!-- Save (direct) -->
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

      <!-- Save‑As -->
      <button class="p-1 hover:bg-gray-200 rounded ml-1" @click="saveAsDialog">
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
import { ref, reactive, computed, watch, onMounted, inject } from 'vue';
import { readFile, writeFile } from '@/services/HTTP/HttpFileClient';
import MarkdownRenderer from '@/components/Markdown/MarkdownRenderer.vue';
import { svgIcons } from '@/components/Icons/SvgIcons';

/* ------------------------------------------------------------------
 * 1 · Props / Emits / WindowBus injection
 * ------------------------------------------------------------------ */
interface FileDialogOptions {
  mode: 'open' | 'save';
  mimeFilter?: string[];
  suggestedName?: string;
  initialPath?: string;
  initialMount?: string;
}
interface WindowBus {
  requestFile: (
    opts: FileDialogOptions,
  ) => Promise<
    | { cancelled: true }
    | { cancelled: false; mount: string; path: string; name: string }
  >;
}

const bus = inject<WindowBus>('windowBus')!;

const props = defineProps<{
  log: (namespace: string, message: string, isError?: boolean) => void;
}>();
const emit = defineEmits<{
  (e: 'updateTitle', title: string): void;
}>();
const NS = 'DocumentEditor.vue';

/* ------------------------------------------------------------------
 * 2 · Reactive state
 * ------------------------------------------------------------------ */
const content = ref('');
const isPreviewActive = ref(false);
const hasUnsavedChanges = ref(false);
let isLoadingFile = false;

const currentFile = reactive<{ dir: string | null; name: string | null; mount: string | null }>(
  {
    dir: null,
    name: null,
    mount: null,
  },
);

/* ------------------------------------------------------------------ */
const fullPath = computed(() =>
  currentFile.dir && currentFile.name ? `${currentFile.dir}/${currentFile.name}`.replace('//', '/') : null,
);
const isSaveDisabled = computed(() => !hasUnsavedChanges.value);
const eyeIconSvg = computed(() => (svgIcons.get('eye') || '').replace(/ class=".*?"/, ''));

/* ------------------------------------------------------------------
 * 3 · Watchers
 * ------------------------------------------------------------------ */
watch(
  content,
  () => {
    if (!isLoadingFile) hasUnsavedChanges.value = true;
  },
  { flush: 'sync' },
);

/* ------------------------------------------------------------------
 * 4 · Title Update Logic
 * ------------------------------------------------------------------ */
function updateEditorTitle() {
  const prefix = hasUnsavedChanges.value ? '*' : '';
  const baseName = currentFile.name ?? 'New File';
  emit('updateTitle', `${prefix}${baseName} - Document Editor`);
}

// Watch for changes that affect the title
watch(hasUnsavedChanges, updateEditorTitle);
watch(() => currentFile.name, updateEditorTitle);

/* ------------------------------------------------------------------
 * 5 · UI helpers
 * ------------------------------------------------------------------ */
function togglePreview() {
  isPreviewActive.value = !isPreviewActive.value;
  props.log(NS, `Preview mode: ${isPreviewActive.value}`);
}

function createNewFile() {
  content.value = '';
  // Reset currentFile state, keeping mount if it exists
  currentFile.dir = null;
  currentFile.name = null;
  hasUnsavedChanges.value = false; // Resetting content triggers the watcher, but explicitly set here too
  updateEditorTitle(); // Use the central title update function
}

/* ------------------------------------------------------------------
 * 6 · File‑dialog helpers
 * ------------------------------------------------------------------ */
async function openFileDialog() {
  const res = await bus.requestFile({
    mode: 'open',
    mimeFilter: ['text/markdown', 'text/plain'],
    initialPath: currentFile.dir ?? undefined,
    initialMount: currentFile.mount ?? undefined,
  });
  if (res.cancelled) return;
  try {
    isLoadingFile = true;
    content.value = await readFile(res.mount, `${res.path}/${res.name}`);
    Object.assign(currentFile, { dir: res.path, name: res.name, mount: res.mount });
    hasUnsavedChanges.value = false;
    updateEditorTitle(); // Use the central title update function
    props.log(NS, `Opened file: ${res.path}/${res.name}`);
  } catch (e: any) {
    props.log(NS, `Open failed: ${e.message}`, true);
  } finally {
    isLoadingFile = false;
  }
}

async function saveAsDialog() {
  const tgt = await bus.requestFile({
    mode: 'save',
    suggestedName: currentFile.name ?? '',
    initialPath: currentFile.dir ?? undefined,
    initialMount: currentFile.mount ?? undefined,
  });
  if (tgt.cancelled) return;
  try {
    await saveTo(tgt.mount, `${tgt.path}/${tgt.name}`);
    // Update currentFile state *after* successful save
    Object.assign(currentFile, { dir: tgt.path, name: tgt.name, mount: tgt.mount });
    // Title update will be triggered by the currentFile.name watcher
  } catch (e: any) {
    props.log(NS, `Save‑as failed: ${e.message}`, true);
  }
}

async function saveTo(mount: string, path: string) {
  await writeFile(mount, path, content.value);
  hasUnsavedChanges.value = false; // Title update is triggered by the watcher
  props.log(NS, `Saved to ${path}`);
}

async function handleSaveClick() {
  if (fullPath.value && currentFile.mount) {
    try {
      await saveTo(currentFile.mount, fullPath.value);
      // Title update will be triggered by the hasUnsavedChanges watcher
    } catch (e: any) {
      props.log(NS, `Save failed: ${e.message}`, true);
    }
  } else {
    await saveAsDialog();
  }
}

/* ------------------------------------------------------------------ */
onMounted(() => updateEditorTitle()); // Use the central title update function on mount
</script>

<style scoped>
.icon-disabled { filter: grayscale(1) opacity(0.9); }
</style>
