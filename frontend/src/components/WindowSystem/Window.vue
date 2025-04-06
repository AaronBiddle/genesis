<template>
  <div
    class="window-container border border-gray-400 bg-gray-100 flex flex-col"
    :style="windowStyle"
    :class="{ 'resizable': windowData.resizable }"
  >
    <!-- Title Bar -->
    <div
      class="title-bar bg-blue-500 text-white flex justify-between items-center"
      @mousedown.prevent="startDrag"
    >
      <span class="window-title pl-2 py-1">{{ windowData.title }}</span>
      <div class="window-controls self-stretch">
        <button
          class="close-button pr-2 pl-2 h-full flex items-center"
          @click.stop="handleClose"
          title="Close"
        >
          &#x2715;
        </button>
      </div>
    </div>

    <!-- Content Area -->
    <div class="content-area flex-grow bg-white p-2 overflow-auto">
      <component :is="windowData.appComponent" />
    </div>

    <!-- Resize Handles (only if resizable) -->
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
import { computed, ref } from 'vue';
import type { ManagedWindow } from '@/components/WindowSystem/WindowManager';
import {
  bringToFront,
  moveWindow,
  updateWindowBounds,
  closeWindow
} from '@/components/WindowSystem/WindowManager';

// Type alias for resize handle directions
type ResizeDirection = | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

const props = defineProps<{ windowData: ManagedWindow }>();

// Dragging state
const isDragging = ref(false);
const dragOffsetX = ref(0);
const dragOffsetY = ref(0);

// Resizing state
const isResizing = ref(false);
const resizeDirection = ref<ResizeDirection | null>(null);
const resizeStartX = ref(0);
const resizeStartY = ref(0);
const initialX = ref(0); // Store initial window bounds for resizing
const initialY = ref(0);
const initialWidth = ref(0);
const initialHeight = ref(0);

const windowStyle = computed(() => ({
  left: `${props.windowData.x}px`,
  top: `${props.windowData.y}px`,
  width: `${props.windowData.width}px`,
  height: `${props.windowData.height}px`,
  zIndex: props.windowData.zIndex,
  position: 'absolute' as const,
}));

// Start Dragging (Title Bar)
function startDrag(event: MouseEvent) {
  // Only check if resizing is in progress, allow clicking on title text/etc.
  if (isResizing.value) return;
  bringToFront(props.windowData.id);
  isDragging.value = true;
  dragOffsetX.value = event.clientX - props.windowData.x;
  dragOffsetY.value = event.clientY - props.windowData.y;
  window.addEventListener('mousemove', doDrag);
  window.addEventListener('mouseup', stopDrag);
}

function doDrag(event: MouseEvent) {
  if (!isDragging.value) return;
  const newX = event.clientX - dragOffsetX.value;
  const newY = event.clientY - dragOffsetY.value;
  moveWindow(props.windowData.id, newX, newY);
}

function stopDrag() {
  if (isDragging.value) {
    isDragging.value = false;
    window.removeEventListener('mousemove', doDrag);
    window.removeEventListener('mouseup', stopDrag);
  }
}

// Start Resizing (Handles)
function startResize(direction: ResizeDirection, event: MouseEvent) {
  bringToFront(props.windowData.id);
  isResizing.value = true;
  resizeDirection.value = direction;
  resizeStartX.value = event.clientX;
  resizeStartY.value = event.clientY;
  initialX.value = props.windowData.x;
  initialY.value = props.windowData.y;
  initialWidth.value = props.windowData.width;
  initialHeight.value = props.windowData.height;

  window.addEventListener('mousemove', doResize);
  window.addEventListener('mouseup', stopResize);
}

// Perform Resizing
function doResize(event: MouseEvent) {
  if (!isResizing.value || !resizeDirection.value) return;

  const deltaX = event.clientX - resizeStartX.value;
  const deltaY = event.clientY - resizeStartY.value;

  let newX = initialX.value;
  let newY = initialY.value;
  let newWidth = initialWidth.value;
  let newHeight = initialHeight.value;

  // Adjust dimensions and position based on resize direction
  if (resizeDirection.value.includes('left')) {
    newWidth = initialWidth.value - deltaX;
    newX = initialX.value + deltaX;
  }
  if (resizeDirection.value.includes('right')) {
    newWidth = initialWidth.value + deltaX;
  }
  if (resizeDirection.value.includes('top')) {
    newHeight = initialHeight.value - deltaY;
    newY = initialY.value + deltaY;
  }
  if (resizeDirection.value.includes('bottom')) {
    newHeight = initialHeight.value + deltaY;
  }

  // Call the updated function from WindowManager
  updateWindowBounds(props.windowData.id, newX, newY, newWidth, newHeight);
}

// Stop Resizing
function stopResize() {
  if (isResizing.value) {
    isResizing.value = false;
    resizeDirection.value = null;
    window.removeEventListener('mousemove', doResize);
    window.removeEventListener('mouseup', stopResize);
  }
}

// Handle Closing the Window
function handleClose() {
  closeWindow(props.windowData.id);
}

</script>

<style scoped>
.window-container {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  overflow: visible; /* Allow handles to be outside */
  /* Min width/height set in WindowManager, but can be reinforced here if needed */
}

.title-bar {
  user-select: none;
}

.window-title {
  flex-grow: 1; /* Allow title to take space */
  text-overflow: ellipsis; /* Add ellipsis if title is too long */
  white-space: nowrap;
  overflow: hidden;
  margin-right: 8px; /* Space between title and controls */
}

.close-button {
  background: none;
  border: none;
  color: white;
  font-size: 1rem;
  line-height: 1;
}

.close-button:hover {
  background-color: rgba(255, 0, 0, 0.7);
  color: white;
}

.content-area {
  overflow: auto;
  background-color: white; /* Ensure content area has a background */
}

/* Resize Handles Styling */
.resize-handle {
  position: absolute;
  background: transparent; /* Handles are invisible trigger areas */
  z-index: 10; /* Ensure handles are clickable over content */
}

/* Size of the clickable area for handles */
.resize-handle.top,
.resize-handle.bottom {
  left: 8px;
  right: 8px;
  height: 8px;
}

.resize-handle.left,
.resize-handle.right {
  top: 8px;
  bottom: 8px;
  width: 8px;
}

.resize-handle.top-left,
.resize-handle.top-right,
.resize-handle.bottom-left,
.resize-handle.bottom-right {
  width: 16px;
  height: 16px;
}

/* Positioning */
.resize-handle.top { top: -4px; cursor: ns-resize; }
.resize-handle.bottom { bottom: -4px; cursor: ns-resize; }
.resize-handle.left { left: -4px; cursor: ew-resize; }
.resize-handle.right { right: -4px; cursor: ew-resize; }

.resize-handle.top-left { top: -4px; left: -4px; cursor: nwse-resize; }
.resize-handle.top-right { top: -4px; right: -4px; cursor: nesw-resize; }
.resize-handle.bottom-left { bottom: -4px; left: -4px; cursor: nesw-resize; }
.resize-handle.bottom-right { bottom: -4px; right: -4px; cursor: nwse-resize; }

/* Hide handles if window is not resizable (using v-if now, but class could be used too) */
/* .window-container:not(.resizable) .resize-handle { display: none; } */

</style> 