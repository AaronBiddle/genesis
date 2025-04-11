<template>
  <div class="event-bus-inspector p-4">
    <h2 class="text-lg font-semibold mb-4">Event Bus Inspector</h2>
    
    <div class="mb-6 bg-gray-100 p-4 rounded-lg">
      <h3 class="text-md font-medium mb-2">Registered Listeners</h3>
      <div v-if="Object.keys(listeners).length === 0" class="text-gray-500 italic">
        No active listeners registered
      </div>
      <div v-else class="space-y-4">
        <div v-for="(callbacks, windowId) in listeners" :key="windowId" class="border border-gray-200 rounded p-3">
          <div class="flex justify-between items-center mb-2">
            <div class="font-medium">Window ID: {{ windowId }}</div>
            <div class="text-sm text-gray-600">{{ callbacks.length }} listener(s)</div>
          </div>
          <div v-for="(_, index) in callbacks" :key="index" class="text-sm text-gray-700 pl-4">
            Callback #{{ index + 1 }}
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
import { ref, computed, onMounted, onUnmounted, watchEffect } from 'vue';
import eventBus from './eventBus';

// Reactively track listeners from the event bus
const listeners = ref({...eventBus.listeners});

// Update listeners when they change
const updateListeners = () => {
  listeners.value = {...eventBus.listeners};
};

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
    if (!eventBus.listeners[toWindowId.value]) {
      messageError.value = `No listeners found for window ID: ${toWindowId.value}`;
      return;
    }
    
    eventBus.publish(fromWindowId.value, toWindowId.value, messageObject);
    messageSent.value = true;
    
    // Reset after 2 seconds
    setTimeout(() => {
      messageSent.value = false;
    }, 2000);
  } catch (error) {
    messageError.value = `Error sending message: ${error instanceof Error ? error.message : 'Invalid JSON'}`;
  }
};

// Set up polling to update the listeners display
let intervalId: number | null = null;

onMounted(() => {
  // Initial update
  updateListeners();
  
  // Poll for changes every second
  intervalId = window.setInterval(() => {
    updateListeners();
  }, 1000);
  
  // Watch for direct changes to the eventBus listeners
  watchEffect(() => {
    updateListeners();
  });
});

onUnmounted(() => {
  // Clean up interval on component unmount
  if (intervalId !== null) {
    clearInterval(intervalId);
  }
});
</script>

<style scoped>
.event-bus-inspector {
  height: 100%;
  overflow-y: auto;
}
</style> 