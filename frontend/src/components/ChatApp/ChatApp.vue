<template>
  <div class="flex flex-col h-full">
    <div class="bg-gray-100 p-2 border-b flex items-center space-x-2">
      <label for="model-select" class="text-sm font-medium text-gray-700">Model:</label>
      <select
        id="model-select"
        v-model="selectedModel"
        :disabled="modelsLoading || !!modelsError || Object.keys(availableModels).length === 0"
        class="block w-64 pl-3 pr-10 py-1.5 text-base border border-gray-300 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md"
      >
        <option v-if="modelsLoading" value="">Loading models...</option>
        <option v-else-if="modelsError" value="">Error loading models</option>
        <option v-else-if="Object.keys(availableModels).length === 0" value="">No models available</option>
        <option v-for="(details, key) in availableModels" :key="key" :value="key">
          {{ details.display_name }}
        </option>
      </select>
      <span v-if="modelsError" class="text-red-600 text-sm">!</span>
    </div>
    <div class="flex flex-col flex-grow h-full bg-gray-50 p-2 overflow-hidden">
      <div ref="messageContainer" class="flex-grow overflow-y-auto mb-2 space-y-2 pr-2">
        <div v-for="(message, index) in messages" :key="index" :class="getMessageClass(message)">
          <div class="px-3 py-2 rounded-lg max-w-xl" :class="getMessageBubbleClass(message)">
            <template v-if="message.role === 'assistant'">
              <MarkdownRenderer :source="message.content" />
            </template>
            <template v-else>
              <div class="whitespace-pre-wrap">{{ message.content }}</div>
            </template>
          </div>
        </div>
      </div>
      <div class="flex items-center border-t pt-2">
        <textarea
          v-model="newMessage"
          placeholder="Type your message (Shift+Enter for newline)..."
          class="flex-grow border rounded-l-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
          @keydown.enter.exact.prevent="sendMessage"
          :disabled="isLoading"
          rows="4"
        ></textarea>
        <button
          @click="sendMessage"
          :disabled="!newMessage.trim() || isLoading"
          class="bg-blue-500 text-white px-3 py-2 rounded-r-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center h-full transition-colors duration-200 ease-in-out"
          style="height: calc(4 * 1.5rem + 1rem + 2px);"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-6 w-6">
            <path
              fill-rule="evenodd"
              d="M3 16.5 L12 16.5 L12 22.5 L21 12 L12 1.5 L12 7.5 L3 7.5 Z"
              clip-rule="evenodd"
              stroke="currentColor"
              stroke-width="1.5" 
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue';
import MarkdownRenderer from '@/components/Markdown/MarkdownRenderer.vue';
import {
  generateResponse,
  getModels,
  type Message as AIMessage,
  type GenerateRequest,
  type GetModelsResponse,
  type ModelDetails
} from '@/services/AIClient';

const messages = ref<AIMessage[]>([]);
const newMessage = ref('');
const messageContainer = ref<HTMLElement | null>(null);
const isLoading = ref(false);

const availableModels = ref<Record<string, ModelDetails>>({});
const selectedModel = ref<string>('');
const modelsLoading = ref(true);
const modelsError = ref<string | null>(null);

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
  newMessage.value = '';
  isLoading.value = true;

  try {
    const requestData: GenerateRequest = {
      model: selectedModel.value,
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

onMounted(async () => {
  modelsLoading.value = true;
  modelsError.value = null;
  try {
    const response: GetModelsResponse = await getModels();
    availableModels.value = response.models;
    const modelKeys = Object.keys(response.models);
    if (modelKeys.length > 0) {
      selectedModel.value = modelKeys[0];
    }
  } catch (error: any) {
    console.error('Failed to fetch models:', error);
    modelsError.value = error.message || 'Unknown error fetching models';
  } finally {
    modelsLoading.value = false;
  }
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