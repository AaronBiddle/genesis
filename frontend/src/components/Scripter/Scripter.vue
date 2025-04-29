<template>
  <div>
    <div class="toolbar">
      <button v-html="plusIcon"></button>
    </div>
    <!-- Scripter Application Placeholder -->
    <p>Scripter application content will go here.</p>
  </div>
</template>

<script setup lang="ts">
import { svgIcons } from '@/components/Icons/SvgIcons'; // Use @ alias

const plusIcon = svgIcons.get('plus-3');
// Component logic will go here
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  padding: 5px;
  border-bottom: 1px solid #ccc;
  margin-bottom: 10px;
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

/* Component styles will go here */
</style> 