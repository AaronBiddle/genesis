<template>
  <div class="p-4 space-y-4 flex flex-col h-full">
    <h2 class="text-lg font-semibold flex-shrink-0">HTTP Control Panel</h2>
    <button
      @click="sendEchoRequest"
      class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 flex-shrink-0"
    >
      Send Echo Request
    </button>
    <!-- New Message Log Window -->
    <div class="message-log mt-4 p-3 overflow-y-auto bg-gray-800 text-gray-100 rounded border border-gray-600 flex-grow min-h-0">
      <h3 class="font-medium mb-2 sticky top-0 bg-gray-800 pb-1 border-b border-gray-600 z-10">Message Log:</h3>
      <div v-if="messages.length === 0" class="text-gray-500 italic">No messages yet. Click "Send Echo Request".</div>
      <div v-else v-for="message in messages" :key="message.id" class="message mb-2">
        <pre
          :class="[
            'text-sm whitespace-pre-wrap break-all p-2 rounded',
            message.type === 'outgoing' ? 'bg-blue-900 text-blue-200' : '',
            message.type === 'incoming' ? 'bg-green-900 text-green-200' : '',
            message.type === 'error' ? 'bg-red-900 text-red-200 border border-red-700' : ''
          ]"
        >{{ message.content }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { sendEchoRequest as sendEchoRequestApi } from '@/services/HttpClient';

// Add new messages ref
interface Message {
  id: number;
  type: 'outgoing' | 'incoming' | 'error';
  content: string;
}
const messages = ref<Message[]>([]);

const sendEchoRequest = async () => {
  // Optional: Clear log on new request
  // messages.value = [];

  // Construct the payload to be sent (mirroring HttpClient.ts for logging)
  const payload = { message: "Hello from HTTP Control Panel", timestamp: new Date().toISOString() };
  const requestPath = '/frontend/echo'; // Assuming this path from HttpClient.ts

  // Add outgoing message with details
  const outgoingMessageContent = `[${new Date().toLocaleTimeString()}] Sending POST request to ${requestPath}\nPayload:\n${JSON.stringify(payload, null, 2)}`;
  const outgoingMessage = { id: Date.now(), type: 'outgoing' as const, content: outgoingMessageContent };
  messages.value.push(outgoingMessage);

  try {
    const data = await sendEchoRequestApi();
    // Add incoming success message with more detail
    const incomingMessageContent = `[${new Date().toLocaleTimeString()}] Received OK:\n${JSON.stringify(data, null, 2)}`;
    messages.value.push({ id: Date.now() + 1, type: 'incoming' as const, content: incomingMessageContent });
  } catch (err: any) {
    console.error('Error in component while sending echo request:', err);
    // Add incoming error message with more detail
    const errorMessageContent = `[${new Date().toLocaleTimeString()}] Received Error:\n${err.message || 'Failed to send request.'}`;
    messages.value.push({ id: Date.now() + 1, type: 'error' as const, content: errorMessageContent });
  }
};
</script>

<style scoped>
/* Add any component-specific styles here */
pre {
  font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
  /* Ensure text selection is easy */
  user-select: text; /* Standard */
  -webkit-user-select: text; /* Safari */
  -moz-user-select: text; /* Firefox */
  -ms-user-select: text; /* IE 10+ */
}

/* Added a scrollbar style for better visibility in dark mode */
.message-log::-webkit-scrollbar {
  width: 8px;
}

.message-log::-webkit-scrollbar-track {
  background: #2d3748; /* gray-800 */
}

.message-log::-webkit-scrollbar-thumb {
  background-color: #718096; /* gray-500 */
  border-radius: 4px;
  border: 2px solid #2d3748; /* gray-800 */
}

</style> 