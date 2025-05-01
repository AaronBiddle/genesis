<template>
  <div>
    <div class="toolbar">
      <button @click="toggleCommands" v-html="plusIcon"></button>
      <ul v-if="showCommands" class="command-list">
        <li>Dummy Command 1</li>
        <li>Dummy Command 2</li>
        <li>Dummy Command 3</li>
      </ul>
    </div>
    <!-- Scripter Application Placeholder -->
    
    <p>Scripter application content will go here.</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { svgIcons } from '@/components/Icons/SvgIcons'; // Use @ alias

const plusIcon = svgIcons.get('plus-3');
const showCommands = ref(false);

const toggleCommands = () => {
  showCommands.value = !showCommands.value;
};
// Component logic will go here
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  padding: 5px;
  border-bottom: 1px solid #ccc;
  margin-bottom: 10px;
  position: relative; /* Add relative positioning */
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
  background-color: #f0f0f0; /* Light grey hover effect */
  border-radius: 4px; /* Add rounded corners */
}

.toolbar button :deep(svg) {
  width: 24px; /* Adjust size as needed */
  height: 24px; /* Adjust size as needed */
  stroke: green; /* Change color to green */
}

.command-list {
  list-style: none;
  padding: 5px 0;
  margin: 0;
  border: 1px solid #ccc;
  /* border-radius: 4px; */ /* Remove rounded corners */
  position: absolute;
  background-color: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); /* Remove bevel */
  top: 100%; /* Position below the toolbar */
  left: 5px; /* Align with the button padding */
  z-index: 10; /* Ensure it appears above other content */
}

.command-list li {
  padding: 8px 12px;
  cursor: pointer;
}

.command-list li:hover {
  background-color: #f0f0f0;
}

/* Component styles will go here */
</style> 