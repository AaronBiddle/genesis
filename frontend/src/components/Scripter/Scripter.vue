<template>
  <div class="scripter-container">
    <div class="toolbar">
      <button @click="toggleCommands" v-html="plusIcon"></button>
      <ul v-if="showCommands" class="command-list">
        <li v-for="nodeType in availableNodeTypes" :key="nodeType.id" @click="handleCommandClick(nodeType)">
          <span class="icon" v-html="svgIcons.get(nodeType.iconId)"></span>
          <span>{{ nodeType.title }}</span>
        </li>
      </ul>
    </div>
    <!-- Wrap application content -->
    <div class="application-area" ref="applicationAreaRef">
      <!-- Render Node components for each window -->
      <Node
        v-for="win in windows"
        :key="win.id"
        :win="win"
        :container-bounds="containerBounds"
      >
        <!-- Pass content or props to the node if needed -->
      </Node>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineComponent, onMounted, onUnmounted, reactive } from 'vue';
import { svgIcons } from '@/components/Icons/SvgIcons'; // Use @ alias
import { sequenceNodeType } from './nodes/nodes';
import type { NodeTypeDefinition } from './nodes/nodes';
import { addWindow, windows } from '@/components/Scripter/scripterWindowStore'; // Import addWindow and windows
import type { App } from '@/components/WindowSystem/apps'; // Import App type
import Node from './Node.vue'; // Import Node component

// Ref for the application area element
const applicationAreaRef = ref<HTMLElement | null>(null);

// Reactive state for container bounds
const containerBounds = reactive({
  left: 0,
  top: 0,
  width: 0,
  height: 0,
});

let resizeObserver: ResizeObserver | null = null;

// Function to update bounds
const updateBounds = () => {
  if (applicationAreaRef.value) {
    containerBounds.left = 0; // Assuming drag coords are relative to this container
    containerBounds.top = 0;  // Assuming drag coords are relative to this container
    containerBounds.width = applicationAreaRef.value.clientWidth;
    containerBounds.height = applicationAreaRef.value.clientHeight;
     console.log("Updated bounds:", containerBounds);
  }
};

onMounted(() => {
  updateBounds(); // Initial bounds calculation
  if (applicationAreaRef.value) {
    resizeObserver = new ResizeObserver(updateBounds);
    resizeObserver.observe(applicationAreaRef.value);
  }
  // Also update on window resize, as container size might depend on it
  window.addEventListener('resize', updateBounds);
});

onUnmounted(() => {
  if (resizeObserver && applicationAreaRef.value) {
    resizeObserver.unobserve(applicationAreaRef.value);
  }
  window.removeEventListener('resize', updateBounds);
});

const plusIcon = svgIcons.get('plus-3');
const showCommands = ref(false);
const availableNodeTypes = ref<NodeTypeDefinition[]>([sequenceNodeType]);

const toggleCommands = () => {
  showCommands.value = !showCommands.value;
};

// Function to handle command click
const handleCommandClick = (nodeType: NodeTypeDefinition) => {
  console.log('Adding window for:', nodeType.title); // Debug log
  const appConfig: App = {
    id: `scripter-node-${nodeType.id}-${Date.now()}`, // Unique ID for the instance
    title: nodeType.title,
    iconId: nodeType.iconId, // Use the node's icon
    appComponent: PlaceholderComponent, // Use the placeholder for now
    // Pass nodeType as a prop to the placeholder component if needed via launchOptions
    // initialWidth: 300, // Optional: Specify size
    // initialHeight: 200,
    // Add other App properties as needed
  };

  addWindow(appConfig, { launchOptions: { nodeType } }); // Pass nodeType via launchOptions
  showCommands.value = false; // Hide the command list after selection
};

// Define a simple placeholder component
const PlaceholderComponent = defineComponent({
  props: ['nodeType'],
  template: `<div>Placeholder for {{ nodeType?.title || 'Node' }}</div>`,
});
</script>

<style scoped>
.scripter-container {
  display: flex;
  flex-direction: column;
  height: 100%; /* Make container fill parent height */
  /* min-height: 300px; */ /* Example minimum height */
  border: 1px solid #ccc; /* Add border to see container bounds */
}

.toolbar {
  display: flex;
  align-items: center;
  padding: 5px;
  border-bottom: 1px solid #ccc;
  position: relative; /* Add relative positioning */
  background-color: #f0f0f0; /* Light grey background */
}

.toolbar button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toolbar button:hover {
  background-color: #dcdcdc; /* Slightly darker grey hover effect */
  border-radius: 4px; /* Add rounded corners */
}

.toolbar button :deep(svg) {
  width: 24px; /* Adjust size as needed */
  height: 24px; /* Adjust size as needed */
  stroke: green; /* Change color to green */
}

.command-list {
  list-style: none;
  /* padding: 5px 0; */
  margin: 0;
  border: 1px solid #ccc;
  /* border-radius: 4px; */ /* Remove rounded corners */
  position: absolute;
  background-color: #f0f0f0; /* Light grey background */
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); /* Remove bevel */
  top: 100%; /* Position below the toolbar */
  left: 0; /* Align flush left with the toolbar */
  z-index: 10; /* Ensure it appears above other content */
}

.command-list li {
  padding: 8px 12px;
  cursor: pointer;
  display: flex; /* Use flexbox for alignment */
  align-items: center; /* Vertically center icon and text */
}

.command-list li .icon {
  margin-right: 8px; /* Space between icon and text */
  display: inline-flex; /* Keep icon dimensions */
  align-items: center;
}

.command-list li .icon :deep(svg) {
    width: 16px; /* Adjust icon size */
    height: 16px;
    /* Inherit stroke or fill from parent, or set explicitly */
}

.command-list li:hover {
  background-color: #e0e0e0; /* Darker grey hover for list items */
}

/* Component styles will go here */
.application-area {
  background-color: #888888; /* Grey background for application area */
  padding: 10px;
  flex-grow: 1; /* Allow this area to grow */
  position: relative; /* Establish positioning context for absolute children */
  overflow: hidden; /* Prevent children from overflowing */
}
</style> 