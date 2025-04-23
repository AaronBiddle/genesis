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
        :disabled="modelsLoading || !!modelsError || Object.keys(availableModels).length === 0 || isLoading"
        class="pl-3 pr-3 py-1.5 text-base border border-gray-300 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md disabled:opacity-70 disabled:bg-gray-100"
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
            @keydown.enter.exact.prevent="isLoading ? cancelStream() : sendMessage()"
            :disabled="isLoading"
            rows="4"
          ></textarea>
          <button
            ref="sendButtonRef"
            @click="isLoading ? cancelStream() : sendMessage()"
            :disabled="!newMessage.trim() && !isLoading"
            class="text-white px-3 py-2 flex items-center justify-center self-stretch outline-none bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-300 disabled:hover:bg-gray-300"
            :class="[
              {
                'border border-l-0 border-black rounded-r-md': !isInputAreaFocused, 
                'border-2 border-l-0 border-cyan-500 rounded-r-md': isInputAreaFocused
              }
            ]"
          >
            <svg v-if="isLoading" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-6 w-6 text-red-400">
              <path fill-rule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clip-rule="evenodd" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-6 w-6">
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
  getModels,
  type Message as AIMessage,
  type GetModelsResponse,
  type ModelDetails
} from '@/services/HTTP/HttpAIClient';
import { readFile, writeFile } from '@/services/HTTP/HttpFileClient';

// Import WebSocket client and types
import { WsAiClient } from '@/services/WS/WsAiClient';
import type { AiChatPayload } from '@/services/WS/WsAiClient';
import type { InteractionMessage } from '@/services/WS/types';

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
const currentInteractionId = ref<number | null>(null); // State for active stream ID

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
  scrollToBottom();
};

// Helper to update the last assistant message or add a new one
const updateAssistantMessage = (chunk: string) => {
  if (messages.value.length > 0 && messages.value[messages.value.length - 1].role === 'assistant') {
    messages.value[messages.value.length - 1].content += chunk;
  } else {
    // Should ideally not happen if we add an empty assistant message first
    addMessage(chunk, 'assistant');
  }
  scrollToBottom();
};

// Helper to scroll message container only if user is near the bottom
const scrollToBottom = () => {
  nextTick(() => {
    if (messageContainer.value) {
      const el = messageContainer.value;
      // Check if scrolled near the bottom before the DOM update
      // Threshold allows for slight variations
      const scrollThreshold = 10; 
      const isScrolledToBottom = el.scrollHeight - el.clientHeight <= el.scrollTop + scrollThreshold;

      // If the user was scrolled to the bottom, keep them scrolled to the bottom
      if (isScrolledToBottom) {
         el.scrollTop = el.scrollHeight;
      }
    }
  });
};

const sendMessage = async () => {
  const text = newMessage.value.trim();
  // Prevent sending if already loading or no text
  if (!text || currentInteractionId.value !== null) return;

  addMessage(text, 'user');
  newMessage.value = '';
  isLoading.value = true;
  // Add an empty placeholder for the assistant's response
  addMessage('', 'assistant'); 

  try {
    const payload: AiChatPayload = {
      model: selectedModel.value,
      messages: messages.value
        .slice(0, -1) // Exclude the empty assistant message placeholder
        .map(m => ({ role: m.role, content: m.content })),
      stream: true, // Explicitly request streaming
      // Add temperature or system prompt if needed, e.g.:
      // temperature: 0.7,
      // system_prompt: "You are helpful"
    };

    props.log(NS, `Sending WS request: ${JSON.stringify(payload.model)}`);

    const interactionId = await WsAiClient.sendChatMessage(
      payload,
      (message: InteractionMessage) => {
        // props.log(NS, `WS Message received: ${JSON.stringify(message)}`);
        if (message.error) {
          props.log(NS, `WS Error: ${message.error}`, true);
          updateAssistantMessage(`\n\n--- Error: ${message.error} ---`);
          isLoading.value = false;
          currentInteractionId.value = null;
        } else if (message.thinking) {
          // Optional: display thinking status
          // props.log(NS, `WS Thinking: ${message.thinking}`);
        } else if (message.text) {
          updateAssistantMessage(message.text);
        } else if (message.meta) {
          props.log(NS, `WS Stream finished. Meta: ${JSON.stringify(message.meta)}`);
          isLoading.value = false;
          currentInteractionId.value = null;
          // Optional: Display metadata if needed
          // updateAssistantMessage(`\n\n--- Meta: ${JSON.stringify(message.meta)} ---`);
        }
      }
    );

    if (interactionId !== null) {
      props.log(NS, `WS Interaction started with ID: ${interactionId}`);
      currentInteractionId.value = interactionId;
    } else {
      // Handle connection failure before starting
      props.log(NS, "Failed to start WS interaction - connection issue?", true);
      messages.value.pop(); // Remove the empty assistant placeholder
      addMessage("Error: Could not connect to the AI service.", 'assistant');
      isLoading.value = false;
    }

  } catch (error: any) {
    // Catch errors during the initial sendChatMessage call (e.g., setup issues)
    console.error('Error calling WsAiClient.sendChatMessage:', error);
    props.log(NS, `Error sending message: ${error.message}`, true);
    messages.value.pop(); // Remove the empty assistant placeholder
    addMessage(`Error: ${error.message || 'Failed to send message.'}`, 'assistant');
    isLoading.value = false;
    currentInteractionId.value = null; // Ensure state is reset
  }
};

const cancelStream = () => {
  if (currentInteractionId.value !== null) {
    props.log(NS, `Cancelling WS Interaction ID: ${currentInteractionId.value}`);
    const cancelled = WsAiClient.cancelChat(currentInteractionId.value);
    if (cancelled) {
        props.log(NS, `Cancellation request sent for ID: ${currentInteractionId.value}`);
        // Note: isLoading and currentInteractionId are reset in the callback when meta/error arrives
        // Or potentially add a timeout to reset state if meta/error doesn't arrive after cancel
    } else {
        props.log(NS, `Failed to find interaction ID ${currentInteractionId.value} to cancel.`, true);
    }
    // We optimistically assume cancellation will eventually stop the stream and the callback will handle state.
    // If the backend doesn't send meta/error on cancel, we might need explicit state reset here.
    isLoading.value = false; // Reset loading state immediately on cancel attempt
    currentInteractionId.value = null;
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
    const modelsArray: GetModelsResponse = await getModels();
    // Convert array to map keyed by model.name
    const modelsMap: Record<string, ModelDetails> = {};
    modelsArray.forEach(model => { modelsMap[model.name] = model; });
    availableModels.value = modelsMap;
    const modelKeys = Object.keys(modelsMap);
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