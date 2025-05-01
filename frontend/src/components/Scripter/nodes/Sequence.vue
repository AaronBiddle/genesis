<template>
  <div class="sequence-node-window">
    <h3>Sequence Node</h3>
    <p>Content for managing a sequence of commands will go here.</p>
    <!-- Placeholder for sequence steps -->
  </div>
</template>

<script setup lang="ts">
// Import necessary Vue features or node types if needed later
// import { ref } from 'vue';

// Props might be defined here later to receive nodeId or other config
// const props = defineProps({
//   nodeId: {
//     type: Number,
//     required: true
//   }
// });

console.log('Sequence component loaded');
// Logic for the sequence node window will be added here
</script>

<style scoped>
.sequence-node-window {
  padding: 15px;
  border: 1px dashed #aaa;
  background-color: #f9f9f9;
  height: 100%; /* Try to fill parent height */
  box-sizing: border-box; /* Include padding and border in height */
}

h3 {
  margin-top: 0;
  color: #333;
}
</style> 