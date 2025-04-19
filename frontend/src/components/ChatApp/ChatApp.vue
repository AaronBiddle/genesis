<template>
  <div class="flex flex-col h-full">
    <div class="bg-gray-100 p-2 border-b flex items-center space-x-2">
      <!-- Added Toolbar Buttons -->
      <button class="p-1 hover:bg-gray-200 rounded" @click="handleNewClick">
        <img src="@/components/Icons/icons8/icons8-new-file-80.png" alt="New Chat" class="h-6 w-6">
      </button>
      <button class="p-1 hover:bg-gray-200 rounded" @click="handleOpenClick">
        <img src="@/components/Icons/icons8/icons8-open-file-80.png" alt="Open Chat" class="h-6 w-6">
      </button>
      <button 
        class="p-1 hover:bg-gray-200 rounded ml-1 disabled:opacity-50 disabled:hover:bg-transparent"
        @click="handleSaveClick"
        :disabled="!canSaveDirectly" 
      >
        <img 
          src="@/components/Icons/icons8/icons8-save-80.png" 
          alt="Save Chat" 
          class="h-6 w-6"
          :class="{ 'icon-disabled': !canSaveDirectly }"
        >
      </button>
      <button class="p-1 hover:bg-gray-200 rounded ml-1" @click="handleSaveAsClick">
        <img src="@/components/Icons/icons8/icons8-save-as-80.png" alt="Save Chat As" class="h-6 w-6">
      </button>

      <div class="w-px h-6 bg-gray-300 mx-2"></div> <!-- Separator -->

      <label for="model-select" class="text-sm font-medium text-gray-700">Model:</label>
      <select
        id="model-select"
        v-model="selectedModel"
        :disabled="modelsLoading || !!modelsError || Object.keys(availableModels).length === 0"
        class="pl-3 pr-3 py-1.5 text-base border border-gray-300 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md"
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
          <div 
            class="px-3 py-2 rounded-lg" 
            :class="[
              message.role === 'user' 
                ? 'bg-cyan-500 text-white ml-12' 
                : 'bg-gray-200 text-gray-800 mr-12'
            ]"
          >
            <template v-if="message.role === 'assistant'">
              <MarkdownRenderer :source="message.content" />
            </template>
            <template v-else>
              <div class="whitespace-pre-wrap">{{ message.content }}</div>
            </template>
          </div>
        </div>
      </div>
      <div class="pt-2"> 
        <div 
          class="flex items-center" 
          @focusin="handleFocusIn" 
          @focusout="handleFocusOut"
        >
          <textarea
            ref="textareaRef" 
            v-model="newMessage"
            placeholder="Type your message (Shift+Enter for newline)..."
            class="flex-grow p-2 resize-none outline-none"
            :class="{ 
              'border border-black rounded-l-md': !isInputAreaFocused, 
              'border-2 border-cyan-500 rounded-l-md': isInputAreaFocused 
            }"
            @keydown.enter.exact.prevent="sendMessage"
            :disabled="isLoading"
            rows="4"
          ></textarea>
          <button
            ref="sendButtonRef"
            @click="sendMessage"
            :disabled="!newMessage.trim() || isLoading"
            class="bg-cyan-500 text-white px-3 py-2 hover:bg-cyan-600 hover:border-cyan-600 disabled:bg-gray-300 flex items-center justify-center self-stretch outline-none"
            :class="{ 
              'border border-l-0 border-black rounded-r-md': !isInputAreaFocused, 
              'border-2 border-l-0 border-cyan-500 rounded-r-md': isInputAreaFocused 
            }"
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
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, computed } from 'vue';
import MarkdownRenderer from '@/components/Markdown/MarkdownRenderer.vue';
import {
  generateResponse,
  getModels,
  type Message as AIMessage,
  type GenerateRequest,
  type GetModelsResponse,
  type ModelDetails
} from '@/services/HTTP/HttpAIClient';
import { readFile, writeFile } from '@/services/HTTP/HttpFileClient';

const props = defineProps<{
  log: (namespace: string, message: string, isError?: boolean) => void;
  newWindow: (appId: string, launchOptions?: any) => void;
}>();

const NS = 'ChatApp.vue'; // Namespace for logging

const messages = ref<AIMessage[]>([]);
const newMessage = ref('');
const messageContainer = ref<HTMLElement | null>(null);
const isLoading = ref(false);
const isInputAreaFocused = ref(false); // State for combined focus
const textareaRef = ref<HTMLTextAreaElement | null>(null); // Ref for textarea
const sendButtonRef = ref<HTMLButtonElement | null>(null); // Ref for button

// State for current file context
const currentFileName = ref<string | null>(null);
const currentDirectoryPath = ref<string | null>(null);
const currentFileMount = ref<string | null>(null);

// Computed property to determine if Save is possible
const canSaveDirectly = computed(() => {
  return !!currentFileName.value && currentDirectoryPath.value !== null && !!currentFileMount.value;
});

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

// --- Focus Handling for Input Area ---
const handleFocusIn = () => {
  isInputAreaFocused.value = true;
};

const handleFocusOut = () => {
  // Use setTimeout to allow focus to shift within the group before checking
  setTimeout(() => {
    if (document.activeElement !== textareaRef.value && 
        document.activeElement !== sendButtonRef.value) {
      isInputAreaFocused.value = false;
    }
  }, 0);
};
// --- End Focus Handling ---

const getMessageClass = (message: AIMessage) => {
  return message.role === 'user' ? 'flex justify-end' : 'flex justify-start';
};

// --- Toolbar Button Stubs ---
function handleNewClick() {
  props.log(NS, '"New Chat" button clicked');
  messages.value = []; // Clear message history
  newMessage.value = ''; // Optional: clear the input field as well
  currentFileName.value = null;
  currentDirectoryPath.value = null;
  currentFileMount.value = null;
  props.log(NS, 'Chat history and file context cleared.');
}

function handleOpenClick() {
  props.log(NS, '"Open Chat" button clicked');
  const launchOptions: any = { mode: 'open' };
  // Pass the current path if available
  if (currentFileMount.value && currentDirectoryPath.value) {
    launchOptions.initialMount = currentFileMount.value;
    launchOptions.initialPath = currentDirectoryPath.value;
    props.log(NS, `Opening file manager with initial path: Mount=${launchOptions.initialMount}, Path=${launchOptions.initialPath}`);
  } else {
     props.log(NS, `Opening file manager at default location.`);
  }
  props.newWindow('file-manager', launchOptions);
}

function handleSaveClick() {
  props.log(NS, '"Save Chat" button clicked');
  if (!canSaveDirectly.value) {
    props.log(NS, 'Save button clicked, but no valid file context exists.', true);
    return; // Should not happen if button is disabled correctly, but good practice
  }

  const mount = currentFileMount.value!;
  const path = currentDirectoryPath.value!;
  const name = currentFileName.value!;
  const fullPath = `${path}/${name}`.replace('//', '/');

  props.log(NS, `Attempting to save directly to: Mount=${mount}, Path=${fullPath}`);
  try {
    const contentToSave = JSON.stringify(messages.value, null, 2);
    writeFile(mount, fullPath, contentToSave); // Note: await is removed as it's not strictly needed here if we don't block UI
    props.log(NS, `Successfully initiated save to ${fullPath}`);
    // Optionally, you could add tracking for unsaved changes and reset it here
  } catch (error: any) {
    props.log(NS, `Error saving chat file directly to ${fullPath}: ${error.message}`, true);
    // Optionally show user error
  }
}

function handleSaveAsClick() {
  props.log(NS, '"Save Chat As" button clicked');
  const launchOptions: any = { mode: 'save' };
  // Pass the current path if available
  if (currentFileMount.value && currentDirectoryPath.value) {
    launchOptions.initialMount = currentFileMount.value;
    launchOptions.initialPath = currentDirectoryPath.value;
    props.log(NS, `Opening file manager for Save As with initial path: Mount=${launchOptions.initialMount}, Path=${launchOptions.initialPath}`);
  } else {
     props.log(NS, `Opening file manager for Save As at default location.`);
  }
  props.newWindow('file-manager', launchOptions);
}
// --- End Toolbar Button Stubs ---

// --- File Handling --- 
interface FileMessagePayload {
  mode: 'open' | 'save';
  mount: string;
  path: string; // Directory path
  name?: string; // Filename (present in 'open' and 'save' confirmations)
}

interface FileMessage {
  type: 'file';
  payload: FileMessagePayload;
}

async function handleMessage(senderId: number, message: FileMessage | any) {
  props.log(NS, `Received message from window ${senderId}: type=${message?.type}`);

  if (message.type === 'file' && message.payload) {
    const payload = message.payload as FileMessagePayload;

    if (payload.mode === 'open' && payload.name) {
      props.log(NS, `File Manager response (Open): Mount=${payload.mount}, Path=${payload.path}, Name=${payload.name}`);
      const fullPath = `${payload.path}/${payload.name}`.replace('//', '/'); // Basic handling for root
      try {
        const fileContent = await readFile(payload.mount, fullPath);
        const loadedMessages = JSON.parse(fileContent);
        // Basic validation: Check if it's an array
        if (Array.isArray(loadedMessages)) {
          messages.value = loadedMessages;
          currentFileMount.value = payload.mount;
          currentDirectoryPath.value = payload.path;
          currentFileName.value = payload.name;
          props.log(NS, `Successfully loaded chat history from ${fullPath}`);
        } else {
          throw new Error('Invalid chat history format in file.');
        }
      } catch (error: any) {
        props.log(NS, `Error opening/reading chat file ${fullPath}: ${error.message}`, true);
        // Optionally clear state or show user error
      }
    } else if (payload.mode === 'save' && payload.name) {
      props.log(NS, `File Manager response (Save): Mount=${payload.mount}, Path=${payload.path}, Name=${payload.name}`);
      const fullPath = `${payload.path}/${payload.name}`.replace('//', '/');
      try {
        const contentToSave = JSON.stringify(messages.value, null, 2); // Pretty print JSON
        await writeFile(payload.mount, fullPath, contentToSave);
        currentFileMount.value = payload.mount;
        currentDirectoryPath.value = payload.path;
        currentFileName.value = payload.name;
        props.log(NS, `Successfully saved chat history to ${fullPath}`);
      } catch (error: any) {
        props.log(NS, `Error saving chat file to ${fullPath}: ${error.message}`, true);
        // Optionally show user error
      }
    }
  } else {
    props.log(NS, `Received unhandled message type: ${message?.type ?? 'unknown'}`);
  }
}

// Expose handleMessage for Window.vue
defineExpose({ handleMessage });
// --- End File Handling ---

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