<template>
  <div class="event-bus-inspector p-4">
    <h2 class="text-lg font-semibold mb-4">Event Bus Inspector</h2>
    
    <div class="mb-6 bg-gray-100 p-4 rounded-lg">
      <h3 class="text-md font-medium mb-2">Registered Listeners</h3>
      <div v-if="Object.keys(eventBus.listeners).length === 0" class="text-gray-500 italic">
        No active listeners registered
      </div>
      <div v-else class="space-y-2">
        <!-- Iterate through window IDs and their listener entries from eventBus -->
        <div v-for="(entries, windowId) in eventBus.listeners" :key="windowId" class="border border-gray-200 rounded p-3 bg-white">
          <!-- Since subscribe overwrites, there's only one entry per windowId -->
          <div v-if="entries.length > 0" class="flex justify-between items-center">
            <div class="font-medium">Window ID: {{ windowId }}</div>
            <div class="text-sm flex items-center space-x-4">
               <span :class="entries[0].keepAlive ? 'text-green-600 font-semibold' : 'text-red-600'">
                 KeepAlive: {{ entries[0].keepAlive ? 'Yes' : 'No' }}
               </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="message-tester bg-gray-100 p-4 rounded-lg">
      <h3 class="text-md font-medium mb-3">Message Tester</h3>
      
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">From Window ID</label>
          <input 
            v-model.number="fromWindowId" 
            type="number" 
            min="0"
            class="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">To Window ID</label>
          <input 
            v-model.number="toWindowId" 
            type="number" 
            min="0"
            class="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">Message Content (JSON)</label>
        <textarea
          v-model="messageContent"
          rows="3"
          class="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder='{ "type": "test", "data": "Hello World" }'
        ></textarea>
      </div>
      
      <button 
        @click="sendMessage" 
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        :disabled="!isValidForm"
      >
        Send Message
      </button>
      
      <div v-if="messageSent" class="mt-3 text-sm text-green-600">
        Message sent successfully!
      </div>
      <div v-if="messageError" class="mt-3 text-sm text-red-600">
        {{ messageError }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import eventBus from './eventBus';
import type { ListenerMap } from './eventBus'; // Import the type

// Message tester state
const fromWindowId = ref<number>(1);
const toWindowId = ref<number>(2);
const messageContent = ref<string>('{ "type": "test", "data": "Hello from Event Bus Inspector" }');
const messageSent = ref<boolean>(false);
const messageError = ref<string>('');

// Form validation
const isValidForm = computed(() => {
  if (fromWindowId.value === undefined || toWindowId.value === undefined) {
    return false;
  }
  
  try {
    JSON.parse(messageContent.value);
    return true;
  } catch {
    return false;
  }
});

// Send a test message via the event bus
const sendMessage = () => {
  messageSent.value = false;
  messageError.value = '';
  
  try {
    const messageObject = JSON.parse(messageContent.value);
    
    // Check if the target window has any listeners
    if (!eventBus.listeners[toWindowId.value] || eventBus.listeners[toWindowId.value].length === 0) {
      messageError.value = `No listeners found for window ID: ${toWindowId.value}`;
      return;
    }
    
    eventBus.post(fromWindowId.value, toWindowId.value, messageObject);
    messageSent.value = true;
    
    // Reset after 2 seconds
    setTimeout(() => {
      messageSent.value = false;
    }, 2000);
  } catch (error) {
    messageError.value = `Error sending message: ${error instanceof Error ? error.message : 'Invalid JSON'}`;
  }
};
</script>

<style scoped>
.event-bus-inspector {
  height: 100%;
  overflow-y: auto;
}
</style> 