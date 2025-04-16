<template>
  <div class="flex flex-col h-full bg-gray-50 p-2">
    <div ref="messageContainer" class="flex-grow overflow-y-auto mb-2 space-y-2 pr-2">
      <div v-for="(message, index) in messages" :key="index" :class="getMessageClass(message)">
        <div class="px-3 py-2 rounded-lg max-w-xs" :class="getMessageBubbleClass(message)">
          {{ message.content }}
        </div>
      </div>
    </div>
    <div class="flex items-center border-t pt-2">
      <input
        type="text"
        v-model="newMessage"
        placeholder="Type your message..."
        class="flex-grow border rounded-l-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        @keyup.enter="sendMessage"
        :disabled="isLoading"
      />
      <button
        @click="sendMessage"
        :disabled="!newMessage.trim() || isLoading"
        class="bg-cyan-600 text-white px-4 py-2 rounded-r-md hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        style="min-width: 80px;"
      >
        <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span v-else>Send</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue';
import { generateResponse, type Message as AIMessage, type GenerateRequest } from '@/services/AIClient';

interface Message extends AIMessage {}

const messages = ref<AIMessage[]>([]);
const newMessage = ref('');
const messageContainer = ref<HTMLElement | null>(null);
const isLoading = ref(false);

const addMessage = (content: string, role: 'user' | 'assistant') => {
  messages.value.push({ content, role });
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    }
  });
};

const sendMessage = async () => {
  const text = newMessage.value.trim();
  if (!text || isLoading.value) return;

  addMessage(text, 'user');
  const currentMessage = newMessage.value;
  newMessage.value = '';
  isLoading.value = true;

  try {
    const requestData: GenerateRequest = {
      model: 'default',
      messages: messages.value.map(m => ({ role: m.role, content: m.content })),
    };

    const response = await generateResponse(requestData);

    if (response.content) {
      addMessage(response.content, 'assistant');
    } else {
      addMessage("Sorry, I couldn't generate a response.", 'assistant');
      console.error('AI response missing content:', response);
    }
  } catch (error: any) {
    console.error('Error calling AI service:', error);
    addMessage(`Error: ${error.message || 'Failed to get response from AI.'}`, 'assistant');
  } finally {
    isLoading.value = false;
  }
};

const getMessageClass = (message: AIMessage) => {
  return message.role === 'user' ? 'flex justify-end' : 'flex justify-start';
};

const getMessageBubbleClass = (message: AIMessage) => {
  return message.role === 'user'
    ? 'bg-cyan-500 text-white'
    : 'bg-gray-200 text-gray-800';
};

onMounted(() => {
  setTimeout(() => {
    addMessage("Hello! How can I help you today?", 'assistant');
  }, 500);
});

</script>

<style scoped>
/* Optional: Add custom scrollbar styling if desired */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cccccc;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #aaaaaa;
}
</style> 