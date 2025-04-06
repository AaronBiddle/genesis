<template>
  <div 
    class="window-container border border-gray-400 bg-gray-100 flex flex-col"
    :style="windowStyle"
  >
    <!-- Title Bar -->
    <div 
      class="title-bar bg-blue-500 text-white px-2 py-1"
      @mousedown.prevent="startDrag"
    >
      <span>{{ windowData.title }}</span>
      <!-- Add window controls (minimize, maximize, close) later -->
    </div>

    <!-- Content Area -->
    <div class="content-area flex-grow bg-white p-2 overflow-auto">
      <component :is="windowData.appComponent" />
    </div>

    <!-- Resize Handle -->
    <div
      v-if="windowData.resizable"
      class="resize-handle"
      @mousedown.prevent.stop="startResize" 
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ManagedWindow } from '@/components/WindowSystem/WindowManager';
import { bringToFront, moveWindow, resizeWindow } from '@/components/WindowSystem/WindowManager';

// Define props
const props = defineProps<{ windowData: ManagedWindow }>();

// Reactive state for dragging
const isDragging = ref(false);
const dragOffsetX = ref(0);
const dragOffsetY = ref(0);

// Reactive state for resizing
const isResizing = ref(false);
const resizeStartX = ref(0);
const resizeStartY = ref(0);
const initialWidth = ref(0);
const initialHeight = ref(0);

// Compute window style based on ManagedWindow data
const windowStyle = computed(() => ({
  left: `${props.windowData.x}px`,
  top: `${props.windowData.y}px`,
  width: `${props.windowData.width}px`,
  height: `${props.windowData.height}px`,
  zIndex: props.windowData.zIndex,
  position: 'absolute' as const,
}));

// Start dragging
function startDrag(event: MouseEvent) {
  // Don't start dragging if resizing is initiated from the handle
  if (event.target !== event.currentTarget) return;

  bringToFront(props.windowData.id);
  isDragging.value = true;
  dragOffsetX.value = event.clientX - props.windowData.x;
  dragOffsetY.value = event.clientY - props.windowData.y;

  window.addEventListener('mousemove', doDrag);
  window.addEventListener('mouseup', stopDrag);
}

// Perform dragging
function doDrag(event: MouseEvent) {
  if (!isDragging.value) return;
  const newX = event.clientX - dragOffsetX.value;
  const newY = event.clientY - dragOffsetY.value;
  moveWindow(props.windowData.id, newX, newY);
}

// Stop dragging
function stopDrag() {
  if (isDragging.value) {
    isDragging.value = false;
    window.removeEventListener('mousemove', doDrag);
    window.removeEventListener('mouseup', stopDrag);
  }
}

// Start resizing
function startResize(event: MouseEvent) {
  bringToFront(props.windowData.id); // Also bring to front when resizing
  isResizing.value = true;
  resizeStartX.value = event.clientX;
  resizeStartY.value = event.clientY;
  initialWidth.value = props.windowData.width;
  initialHeight.value = props.windowData.height;

  window.addEventListener('mousemove', doResize);
  window.addEventListener('mouseup', stopResize);
}

// Perform resizing
function doResize(event: MouseEvent) {
  if (!isResizing.value) return;

  const deltaX = event.clientX - resizeStartX.value;
  const deltaY = event.clientY - resizeStartY.value;

  const newWidth = initialWidth.value + deltaX;
  const newHeight = initialHeight.value + deltaY;

  resizeWindow(props.windowData.id, newWidth, newHeight); // resizeWindow handles minimums
}

// Stop resizing
function stopResize() {
  if (isResizing.value) {
    isResizing.value = false;
    window.removeEventListener('mousemove', doResize);
    window.removeEventListener('mouseup', stopResize);
  }
}

// Add script logic later (e.g., handling resizing)
</script>

<style scoped>
.window-container {
  /* Add styles for resizing, etc. later */
  min-width: 200px; /* Example minimum size */
  min-height: 150px;
  position: absolute; /* Needed for dragging and stacking */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  overflow: hidden; /* Hide content overflow initially, content area handles scroll */
}

.title-bar {
  user-select: none; /* Prevent text selection during drag */
  cursor: grab; /* Indicate grabbable area */
}

.title-bar:active {
  cursor: grabbing; /* Indicate dragging state */
}

.content-area {
  /* Ensure content area can scroll if needed */
  overflow: auto;
}

.resize-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 16px; /* Adjust size as needed */
  height: 16px; /* Adjust size as needed */
  background: transparent; /* Make it invisible or style as desired */
  /* Optional: Add a visual indicator like a small icon or border */
  /* border-bottom: 2px solid black; */
  /* border-right: 2px solid black; */
  cursor: nwse-resize; /* Standard resize cursor */
}
</style> 