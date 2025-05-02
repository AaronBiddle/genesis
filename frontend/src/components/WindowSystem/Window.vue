<template>
  <div
    class="window-container border border-gray-400 bg-gray-100 flex flex-col"
    :style="windowStyle"
    :class="{ resizable: windowData.resizable }"
    @mousedown="bringToFrontLocal"
  >
    <!-- Title Bar -->
    <div
      class="title-bar text-white flex justify-between items-center border-b border-gray-300"
      :class="windowData.titleBarColor || 'bg-blue-500'"
      @mousedown.prevent="startDrag"
    >
      <div class="flex items-center flex-grow min-w-0">
        <span
          v-if="iconSvg"
          class="icon-container pl-2 w-7 h-6 mr-2 flex-shrink-0"
          :class="windowData.iconColor || ''"
          v-html="iconSvg"
        ></span>
        <span class="window-title pl-2 py-1" :class="windowData.titleColor || ''">
          {{ dynamicTitle }}
        </span>
      </div>
      <div class="window-controls self-stretch flex-shrink-0">
        <button
          class="close-button pr-3 pl-3 h-full flex items-center"
          :class="windowData.titleColor || ''"
          @click.stop="handleClose"
          title="Close"
        >
          &#x2715;
        </button>
      </div>
    </div>

    <!-- Content Area -->
    <div class="content-area flex-grow bg-white">
      <component
        ref="appComponentRef"
        :is="windowData.appComponent"
        :key="windowData.id"
        :sendParent="sendParent"
        :getLaunchOptions="getLaunchOptions"
        :newWindow="newWindow"
        :log="logFromChild"
        @close="handleClose"
        @update-title="handleUpdateTitle"
      />
    </div>

    <!-- Resize Handles -->
    <template v-if="windowData.resizable">
      <div class="resize-handle top-left" @mousedown.prevent.stop="startResize('top-left', $event)"></div>
      <div class="resize-handle top" @mousedown.prevent.stop="startResize('top', $event)"></div>
      <div class="resize-handle top-right" @mousedown.prevent.stop="startResize('top-right', $event)"></div>
      <div class="resize-handle left" @mousedown.prevent.stop="startResize('left', $event)"></div>
      <div class="resize-handle right" @mousedown.prevent.stop="startResize('right', $event)"></div>
      <div class="resize-handle bottom-left" @mousedown.prevent.stop="startResize('bottom-left', $event)"></div>
      <div class="resize-handle bottom" @mousedown.prevent.stop="startResize('bottom', $event)"></div>
      <div class="resize-handle bottom-right" @mousedown.prevent.stop="startResize('bottom-right', $event)"></div>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  ref,
  shallowRef,
  watch,
  onMounted,
  onUnmounted,
  inject,
  provide,
} from 'vue';
import type { ComponentPublicInstance } from 'vue';
import type { ManagedWindow } from './windowStore';
import { apps } from './apps';
import eventBus from './eventBus';
import { svgIcons } from '@/components/Icons/SvgIcons';
import { log } from '@/components/Logger/loggerStore';

/* ------------------------------------------------------------------
   1  Props & injection
   ------------------------------------------------------------------ */
const props = defineProps<{ windowData: ManagedWindow }>();

interface WindowStore {
  bringToFront(id: number): void;
  moveWindow(id: number, x: number, y: number): void;
  updateWindowBounds(id: number, x: number, y: number, w: number, h: number): void;
  closeWindow(id: number): void;
  addWindow(app: any, opts?: any): void;
}

// The non‑null assertion (!) tells TypeScript that we guarantee
// the provider exists; runtime safety is still preserved because
// Vue will throw if the injection is missing.
const store = inject<WindowStore>('windowStore')!;

/* ------------------------------------------------------------------
   2  Refs & computed
   ------------------------------------------------------------------ */
const NS = 'Window.vue';

const isDragging = ref(false);
const dragOffsetX = ref(0);
const dragOffsetY = ref(0);

const isResizing = ref(false);
const resizeDirection = ref<
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | null
>(null);
const resizeStartX = ref(0);
const resizeStartY = ref(0);
const initialX = ref(0);
const initialY = ref(0);
const initialWidth = ref(0);
const initialHeight = ref(0);

const appComponentRef = shallowRef<ComponentPublicInstance | null>(null);

// Add a ref for the dynamic title
const dynamicTitle = ref(props.windowData.title);

const windowStyle = computed(() => ({
  left: `${props.windowData.x}px`,
  top: `${props.windowData.y}px`,
  width: `${props.windowData.width}px`,
  height: `${props.windowData.height}px`,
  zIndex: props.windowData.zIndex,
  position: 'absolute' as const,
}));

const iconSvg = computed(() => svgIcons.get(props.windowData.iconId));

/* ------------------------------------------------------------------
   3  Drag / focus helpers
   ------------------------------------------------------------------ */
function bringToFrontLocal() {
  store.bringToFront(props.windowData.id);
}

function startDrag(e: MouseEvent) {
  if (isResizing.value) return;
  isDragging.value = true;
  dragOffsetX.value = e.clientX - props.windowData.x;
  dragOffsetY.value = e.clientY - props.windowData.y;
  bringToFrontLocal();
  window.addEventListener('mousemove', doDrag);
  window.addEventListener('mouseup', stopDrag);
}
function doDrag(e: MouseEvent) {
  if (!isDragging.value) return;
  const newX = e.clientX - dragOffsetX.value;
  const newY = e.clientY - dragOffsetY.value;
  store.moveWindow(props.windowData.id, newX, newY);
}
function stopDrag() {
  if (!isDragging.value) return;
  isDragging.value = false;
  window.removeEventListener('mousemove', doDrag);
  window.removeEventListener('mouseup', stopDrag);
}

/* ------------------------------------------------------------------
   4  Resize helpers
   ------------------------------------------------------------------ */
function startResize(direction: typeof resizeDirection.value, e: MouseEvent) {
  bringToFrontLocal();
  isResizing.value = true;
  resizeDirection.value = direction;
  resizeStartX.value = e.clientX;
  resizeStartY.value = e.clientY;
  initialX.value = props.windowData.x;
  initialY.value = props.windowData.y;
  initialWidth.value = props.windowData.width;
  initialHeight.value = props.windowData.height;
  window.addEventListener('mousemove', doResize);
  window.addEventListener('mouseup', stopResize);
}
function doResize(e: MouseEvent) {
  if (!isResizing.value || !resizeDirection.value) return;
  const dx = e.clientX - resizeStartX.value;
  const dy = e.clientY - resizeStartY.value;
  let x = initialX.value;
  let y = initialY.value;
  let w = initialWidth.value;
  let h = initialHeight.value;
  if (resizeDirection.value.includes('left')) {
    w -= dx;
    x += dx;
  }
  if (resizeDirection.value.includes('right')) {
    w += dx;
  }
  if (resizeDirection.value.includes('top')) {
    h -= dy;
    y += dy;
  }
  if (resizeDirection.value.includes('bottom')) {
    h += dy;
  }
  store.updateWindowBounds(props.windowData.id, x, y, w, h);
}
function stopResize() {
  if (!isResizing.value) return;
  isResizing.value = false;
  resizeDirection.value = null;
  window.removeEventListener('mousemove', doResize);
  window.removeEventListener('mouseup', stopResize);
}

/* ------------------------------------------------------------------
   5  Close / messaging helpers
   ------------------------------------------------------------------ */
function handleClose() {
  store.closeWindow(props.windowData.id);
}

// Handler for the updateTitle event
function handleUpdateTitle(newTitle: string) {
  dynamicTitle.value = newTitle;
  log(NS, `Updated title for window ${props.windowData.id} to: ${newTitle}`);
}

function sendParent(message: any) {
  if (props.windowData.parentId !== undefined) {
    eventBus.post(props.windowData.id, props.windowData.parentId, message);
    log(NS, `Window ${props.windowData.id} → parent ${props.windowData.parentId}`);
  }
}
function getLaunchOptions() {
  return props.windowData.launchOptions;
}
function newWindow(appId: string, launchOptions?: any) {
  const app = apps.find((a) => a.id === appId);
  if (app) {
    store.addWindow(app, { parentId: props.windowData.id, launchOptions });
  } else {
    log(NS, `Unknown appId ${appId}`, true);
  }
}
function logFromChild(ns: string, message: string, isError = false) {
  log(ns, message, isError, props.windowData.id);
}

/* ------------------------------------------------------------------
   6  Event bus subscription for child handleMessage
   ------------------------------------------------------------------ */
const subscribed = ref(false);

/* ------------------------------------------------------------ *
 *  A.  Promise-based File-Dialog service                        *
 * ------------------------------------------------------------ */
interface FileDialogOptions {
  mode: 'open' | 'save';
  /** optional filters or hints */
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
    | {
        cancelled: false;
        token: number;
        mount: string;
        path: string;
        name: string;
      }
  >;
}

const pendingFilePromises = new Map<number, (r: any) => void>();
let nextFileToken = 0;

function requestFile(opts: FileDialogOptions) {
  return new Promise<any>((resolve) => {
    const token = nextFileToken++;
    pendingFilePromises.set(token, resolve);
    // Re-use the existing window-spawner
    // Pass *all* opts through to the file-manager
    newWindow('file-manager', { token, ...opts });
  });
}

provide<WindowBus>('windowBus', { requestFile });

function dispatchMessage(senderId: number, message: any) {
  /* 1 ▸ Resolve File-Manager replies */
  if (message?.type === 'file' && message?.payload?.token !== undefined) {
    const { token } = message.payload;
    const resolver = pendingFilePromises.get(token);
    if (resolver) {
      resolver({ cancelled: false, ...message.payload });
      pendingFilePromises.delete(token);
    }
    return; // intercept handled
  }

  /* 2 ▸ Forward everything else to the child app (if present) */
  const child = appComponentRef.value as any;
  if (child && typeof child.handleMessage === 'function') {
    child.handleMessage(senderId, message);
  }
}

onMounted(() => {
  watch(
    appComponentRef,
    (inst) => {
      if (inst) {
        eventBus.subscribe(
          props.windowData.id,
          dispatchMessage, // <-- use wrapper
          props.windowData.appId,
          false,
        );
        subscribed.value = true;
      }
    },
    { immediate: true },
  );

  /* keep dynamicTitle in sync with external prop updates */
  watch(
    () => props.windowData.title,
    (newVal) => {
      dynamicTitle.value = newVal;
    },
  );
});

onUnmounted(() => {
  if (subscribed.value) {
    eventBus.unsubscribe(props.windowData.id);
  }
});
</script>

<style scoped>
.window-container { box-shadow: 0 4px 8px rgba(0,0,0,0.2); overflow: visible; }
.title-bar { user-select: none; }
.window-title { flex-grow: 1; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; margin-right: 8px; }
.close-button { background: none; border: none; font-size: 1rem; line-height: 1; }
.close-button:hover { background-color: rgba(255,0,0,0.7); }
.content-area { overflow: auto; background-color: white; }
.resize-handle { position: absolute; background: transparent; z-index: 10; }
.resize-handle.top, .resize-handle.bottom { left: 8px; right: 8px; height: 8px; }
.resize-handle.left, .resize-handle.right { top: 8px; bottom: 8px; width: 8px; }
.resize-handle.top-left, .resize-handle.top-right, .resize-handle.bottom-left, .resize-handle.bottom-right { width: 16px; height: 16px; }
.resize-handle.top { top: -4px; cursor: ns-resize; }
.resize-handle.bottom { bottom: -4px; cursor: ns-resize; }
.resize-handle.left { left: -4px; cursor: ew-resize; }
.resize-handle.right { right: -4px; cursor: ew-resize; }
.resize-handle.top-left { top: -4px; left: -4px; cursor: nwse-resize; }
.resize-handle.top-right { top: -4px; right: -4px; cursor: nesw-resize; }
.resize-handle.bottom-left { bottom: -4px; left: -4px; cursor: nesw-resize; }
.resize-handle.bottom-right { bottom: -4px; right: -4px; cursor: nwse-resize; }
.icon-container :deep(svg) { width: 100%; height: 100%; display: block; }
</style>
