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
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ManagedWindow } from '@/components/WindowSystem/WindowManager';
import { bringToFront, moveWindow } from '@/components/WindowSystem/WindowManager';

// Define props
const props = defineProps<{ windowData: ManagedWindow }>();

// Reactive state for dragging
const isDragging = ref(false);
const offsetX = ref(0);
const offsetY = ref(0);

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
  bringToFront(props.windowData.id);
  isDragging.value = true;
  offsetX.value = event.clientX - props.windowData.x;
  offsetY.value = event.clientY - props.windowData.y;

  // Add global listeners for mouse move and mouse up
  window.addEventListener('mousemove', doDrag);
  window.addEventListener('mouseup', stopDrag);
}

// Perform dragging
function doDrag(event: MouseEvent) {
  if (!isDragging.value) return;

  const newX = event.clientX - offsetX.value;
  const newY = event.clientY - offsetY.value;
  moveWindow(props.windowData.id, newX, newY);
}

// Stop dragging
function stopDrag() {
  if (isDragging.value) {
    isDragging.value = false;
    // Remove global listeners
    window.removeEventListener('mousemove', doDrag);
    window.removeEventListener('mouseup', stopDrag);
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
</style> 