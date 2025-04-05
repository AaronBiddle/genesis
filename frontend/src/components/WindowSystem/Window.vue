<template>
  <div 
    class="window-container border border-gray-400 bg-gray-100 flex flex-col"
    :style="windowStyle"
    @mousedown="onMouseDown"
  >
    <!-- Title Bar -->
    <div class="title-bar bg-blue-500 text-white px-2 py-1 cursor-move">
      <span>{{ windowData.title }}</span>
      <!-- Add window controls (minimize, maximize, close) later -->
    </div>

    <!-- Content Area -->
    <div class="content-area flex-grow bg-white p-2">
      <slot></slot> <!-- Where the app content will be injected -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ManagedWindow } from './WindowManager';
import { bringToFront } from './WindowManager'; // Import bringToFront

// Define props
const props = defineProps<{ windowData: ManagedWindow }>();

// Compute window style based on ManagedWindow data
const windowStyle = computed(() => ({
  left: `${props.windowData.x}px`,
  top: `${props.windowData.y}px`,
  width: `${props.windowData.width}px`,
  height: `${props.windowData.height}px`,
  zIndex: props.windowData.zIndex,
}));

// Handle bringing window to front on click
function onMouseDown() {
  bringToFront(props.windowData.id);
}

// Add script logic later (e.g., handling dragging)
</script>

<style scoped>
.window-container {
  /* Add styles for resizing, etc. later */
  min-width: 200px; /* Example minimum size */
  min-height: 150px;
  position: absolute; /* Needed for dragging and stacking */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  overflow: hidden; /* Hide content overflow */
}

.title-bar {
  user-select: none; /* Prevent text selection during drag */
}
</style> 