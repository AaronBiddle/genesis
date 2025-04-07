<template>
  <div class="p-4 space-y-4">
    <h2 class="text-lg font-semibold">HTTP Control Panel</h2>
    <button
      @click="sendEchoRequest"
      class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
    >
      Send Echo Request
    </button>
    <div v-if="response" class="mt-4 p-3 bg-gray-100 rounded border border-gray-300">
      <h3 class="font-medium mb-2">Server Response:</h3>
      <pre class="text-sm whitespace-pre-wrap break-all">{{ response }}</pre>
    </div>
    <div v-if="error" class="mt-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">
       <h3 class="font-medium mb-2">Error:</h3>
       <pre class="text-sm whitespace-pre-wrap break-all">{{ error }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { sendEchoRequest as sendEchoRequestApi } from '@/services/HttpClient';

const response = ref<any>(null);
const error = ref<string | null>(null);

const sendEchoRequest = async () => {
  response.value = null; // Clear previous response
  error.value = null; // Clear previous error
  try {
    const data = await sendEchoRequestApi();
    response.value = data;
  } catch (err: any) {
    console.error('Error in component while sending echo request:', err);
    error.value = err.message || 'Failed to send request.';
  }
};
</script>

<style scoped>
/* Add any component-specific styles here */
pre {
  font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
}
</style> 