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

      <!-- Settings Button -->
      <button
        class="p-1 hover:bg-gray-200 rounded ml-auto"
        @click="handleSettingsClick"
        title="Settings"
      >
        <span v-html="svgIcons.get('settings')"></span>
      </button>
    </div>
    <div class="flex flex-col flex-grow h-full bg-gray-50 p-2 overflow-hidden">
      <div ref="messageContainer" class="flex-grow overflow-y-auto mb-2 space-y-2 pr-2">
        <div v-for="(message, index) in messages" :key="index" :class="getMessageClass(message)" class="flex items-start">
          <div 
            class="px-3 py-2 rounded-lg relative max-w-full"
            :class="[
              message.role === 'user' 
                ? 'bg-cyan-500 text-white ml-12' 
                : 'bg-gray-200 text-gray-800'
            ]"
          >
            <template v-if="message.role === 'assistant'">
              <!-- Thinking Section (Collapsible) -->
              <div v-if="currentThinkingText.length > 0 && index === messages.length - 1" class="mb-2 border-b border-gray-300 pb-1">
                <button 
                  @click="isThinkingExpanded = !isThinkingExpanded"
                  class="text-xs text-gray-500 hover:text-gray-700 flex items-center w-full text-left"
                >
                  <span class="font-medium">Thinking...</span>
                  <!-- Chevron Icon -->
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 ml-1 transition-transform duration-200" :class="{ 'rotate-90': isThinkingExpanded }" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>
                <div v-show="isThinkingExpanded" class="mt-1">
                  <pre class="text-xs text-gray-500 font-mono whitespace-pre-wrap bg-gray-100 p-1 rounded">{{ currentThinkingText }}</pre>
                </div>
              </div>
              <!-- Main Assistant Content -->
              <template v-if="!message.isRawText">
                 <MarkdownRenderer :source="message.content" />
              </template>
              <template v-else>
                <pre class="text-xs font-mono whitespace-pre-wrap bg-gray-100 p-1 rounded mt-1">{{ message.content }}</pre>
              </template>
            </template>
            <template v-else>
              <div class="whitespace-pre-wrap">{{ message.content }}</div>
            </template>
          </div>
          <!-- Conditionally render the button ONLY for assistant messages, outside the bubble -->
          <button
            v-if="message.role === 'assistant'"
            @click="message.isRawText = !message.isRawText"
            class="p-0.5 bg-gray-200 hover:bg-gray-300 rounded text-gray-600 hover:text-gray-800 z-10 sticky flex-shrink-0 ml-1 mr-12"
            :title="message.isRawText ? 'Show Rendered Markdown' : 'Show Raw Text'"
            style="top: 4px;"
          >
            <span v-if="message.isRawText" v-html="svgIcons.get('eye')"></span>
            <span v-else v-html="svgIcons.get('tag')"></span>
          </button>
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
  type Message as AIMessageBase,
  type GetModelsResponse,
  type ModelDetails
} from '@/services/HTTP/HttpAIClient';
import { readFile, writeFile } from '@/services/HTTP/HttpFileClient';

// Import WebSocket client and types
import { WsAiClient } from '@/services/WS/WsAiClient';
import type { AiChatPayload } from '@/services/WS/WsAiClient';
import type { InteractionMessage } from '@/services/WS/types';

// Import SVG Icons
import { svgIcons } from '@/components/Icons/SvgIcons';

// Define extended message type locally
interface AIMessage extends AIMessageBase {
  isRawText?: boolean;
  thinkingLog?: string;
}

const props = defineProps<{
  log: (namespace: string, message: string, isError?: boolean) => void;
  newWindow: (appId: string, launchOptions?: any) => void;
}>();

// import { getCurrentInstance } from 'vue';
// const NS = `ChatApp.vue:${getCurrentInstance()?.uid}`;
const NS = `ChatApp.vue`;

const messages = ref<AIMessage[]>([]);
const newMessage = ref('');
const messageContainer = ref<HTMLElement | null>(null);
const isLoading = ref(false);
const isInputAreaFocused = ref(false);
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const sendButtonRef = ref<HTMLButtonElement | null>(null);
const currentInteractionId = ref<number | null>(null);

// --- AI Settings ---
const temperature = ref<number>(0.7);
const systemPrompt = ref<string>('You are a helpful assistant.');
// -------------------

// State for thinking process visualization
const currentThinkingText = ref<string>('');
const isThinkingExpanded = ref<boolean>(false);

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
  messages.value.push({ content, role, isRawText: false });
  scrollToBottom();
};

// Helper to update the last assistant message or add a new one
const updateAssistantMessage = (chunk: string) => {
  if (messages.value.length > 0 && messages.value[messages.value.length - 1].role === 'assistant') {
    const lastMessage = messages.value[messages.value.length - 1];
    lastMessage.content += chunk;
    if (lastMessage.isRawText === undefined) {
      lastMessage.isRawText = false;
    }
  } else {
    addMessage(chunk, 'assistant');
  }
  scrollToBottom();
};

// Helper to scroll message container only if user is near the bottom
const scrollToBottom = () => {
  nextTick(() => {
    if (messageContainer.value) {
      const el = messageContainer.value;
      const scrollThreshold = 10; 
      const isScrolledToBottom = el.scrollHeight - el.clientHeight <= el.scrollTop + scrollThreshold;

      if (isScrolledToBottom) {
         el.scrollTop = el.scrollHeight;
      }
    }
  });
};

const sendMessage = async () => {
  const text = newMessage.value.trim();
  if (!text || currentInteractionId.value !== null) return;

  addMessage(text, 'user');
  newMessage.value = '';
  isLoading.value = true;
  addMessage('', 'assistant'); 

  try {
    const payload: AiChatPayload = {
      model: selectedModel.value,
      messages: messages.value
        .slice(0, -1)
        .map(m => ({ role: m.role, content: m.content })),
      stream: true,
      temperature: temperature.value,
      system_prompt: systemPrompt.value || undefined,
    };

    props.log(NS, `Sending WS request: model=${payload.model}, temp=${payload.temperature}, sys_prompt=${payload.system_prompt}`);

    const interactionId = await WsAiClient.sendChatMessage(
      payload,
      (message: InteractionMessage) => {
        if (message.error) {
          props.log(NS, `WS Error: ${message.error}`, true);
          updateAssistantMessage(`\n\n--- Error: ${message.error} ---`);
          isLoading.value = false;
          currentInteractionId.value = null;
          currentThinkingText.value = '';
          isThinkingExpanded.value = false;
        } else if (message.thinking) {
          currentThinkingText.value += message.thinking;
        } else if (message.text) {
          updateAssistantMessage(message.text);
        } else if (message.meta) {
          props.log(NS, `WS Stream finished. Meta: ${JSON.stringify(message.meta)}`);
          isLoading.value = false;
          currentInteractionId.value = null;
        }
      }
    );

    if (interactionId !== null) {
      props.log(NS, `WS Interaction started with ID: ${interactionId}`);
      currentInteractionId.value = interactionId;
    } else {
      props.log(NS, "Failed to start WS interaction - connection issue?", true);
      messages.value.pop();
      addMessage("Error: Could not connect to the AI service.", 'assistant');
      isLoading.value = false;
    }

  } catch (error: any) {
    console.error('Error calling WsAiClient.sendChatMessage:', error);
    props.log(NS, `Error sending message: ${error.message}`, true);
    messages.value.pop();
    addMessage(`Error: ${error.message || 'Failed to send message.'}`, 'assistant');
    isLoading.value = false;
    currentInteractionId.value = null;
  }
};

const cancelStream = () => {
  if (currentInteractionId.value !== null) {
    props.log(NS, `Cancelling WS Interaction ID: ${currentInteractionId.value}`);
    const cancelled = WsAiClient.cancelChat(currentInteractionId.value);
    if (cancelled) {
        props.log(NS, `Cancellation request sent for ID: ${currentInteractionId.value}`);
    } else {
        props.log(NS, `Failed to find interaction ID ${currentInteractionId.value} to cancel.`, true);
    }
    isLoading.value = false;
    currentInteractionId.value = null;
  }
};

const handleFocusIn = () => {
  isInputAreaFocused.value = true;
};

const handleFocusOut = () => {
  setTimeout(() => {
    if (document.activeElement !== textareaRef.value && 
        document.activeElement !== sendButtonRef.value) {
      isInputAreaFocused.value = false;
    }
  }, 0);
};

const getMessageClass = (message: AIMessage) => {
  return message.role === 'user' ? 'flex justify-end' : 'flex justify-start';
};

function handleNewClick() {
  props.log(NS, '"New Chat" button clicked');
  messages.value = [];
  newMessage.value = '';
  currentFileName.value = null;
  currentDirectoryPath.value = null;
  currentFileMount.value = null;
  // Reset settings to defaults
  temperature.value = 0.7;
  systemPrompt.value = 'You are a helpful assistant.';
  props.log(NS, 'Chat history, file context, and settings reset to defaults.');
}

function handleOpenClick() {
  props.log(NS, '"Open Chat" button clicked');
  const launchOptions: any = { mode: 'open' };
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
    return;
  }

  const mount = currentFileMount.value!;
  const path = currentDirectoryPath.value!;
  const name = currentFileName.value!;
  const fullPath = `${path}/${name}`.replace('//', '/');

  props.log(NS, `Attempting to save directly to: Mount=${mount}, Path=${fullPath}`);
  try {
    const messagesToSave = JSON.parse(JSON.stringify(messages.value));
    if (messagesToSave.length > 0) {
      const lastMessage = messagesToSave[messagesToSave.length - 1];
      if (lastMessage.role === 'assistant' && currentThinkingText.value) {
        lastMessage.thinkingLog = currentThinkingText.value;
        props.log(NS, `Adding thinkingLog to the last message for saving.`);
      }
    }

    // Include system prompt and temperature in saved data
    const dataToSave = { systemPrompt: systemPrompt.value, temperature: temperature.value, messages: messagesToSave };
    const contentToSave = JSON.stringify(dataToSave, null, 2);
    writeFile(mount, fullPath, contentToSave);
    props.log(NS, `Successfully initiated save to ${fullPath}`);
  } catch (error: any) {
    props.log(NS, `Error saving chat file directly to ${fullPath}: ${error.message}`, true);
  }
}

function handleSaveAsClick() {
  props.log(NS, '"Save Chat As" button clicked');
  const launchOptions: any = { mode: 'save' };
  if (currentFileMount.value && currentDirectoryPath.value) {
    launchOptions.initialMount = currentFileMount.value;
    launchOptions.initialPath = currentDirectoryPath.value;
    props.log(NS, `Opening file manager for Save As with initial path: Mount=${launchOptions.initialMount}, Path=${launchOptions.initialPath}`);
  } else {
     props.log(NS, `Opening file manager for Save As at default location.`);
  }
  props.newWindow('file-manager', launchOptions);
}

function handleSettingsClick() {
  props.log(NS, '"Settings" button clicked');
  const launchOptions = {
    initialTemperature: temperature.value,
    initialSystemPrompt: systemPrompt.value,
  };
  props.log(NS, `Opening settings window with options: ${JSON.stringify(launchOptions)}`);
  props.newWindow('chat-settings', launchOptions);
}

interface FileMessagePayload {
  mode: 'open' | 'save';
  mount: string;
  path: string;
  name?: string;
}

interface SettingsMessagePayload {
  temperature: number;
  systemPrompt: string;
}

interface FileMessage {
  type: 'file';
  payload: FileMessagePayload;
}

interface SettingsMessage {
  type: 'settings';
  payload: SettingsMessagePayload;
}

async function handleMessage(senderId: number, message: FileMessage | SettingsMessage | any) {
  props.log(NS, `Received message from window ${senderId}: type=${message?.type}`);

  if (message.type === 'file' && message.payload) {
    const payload = message.payload as FileMessagePayload;

    if (payload.mode === 'open' && payload.name) {
      props.log(NS, `File Manager response (Open): Mount=${payload.mount}, Path=${payload.path}, Name=${payload.name}`);
      const fullPath = `${payload.path}/${payload.name}`.replace('//', '/');
      try {
        const fileContent = await readFile(payload.mount, fullPath);
        const parsed = JSON.parse(fileContent);
        let loadedMessagesRaw: any[];
        if (Array.isArray(parsed)) {
          loadedMessagesRaw = parsed;
        } else if (parsed && Array.isArray(parsed.messages)) {
          loadedMessagesRaw = parsed.messages;
          if (typeof parsed.systemPrompt === 'string') {
            systemPrompt.value = parsed.systemPrompt;
            props.log(NS, `Loaded system prompt from file.`);
          }
          if (typeof parsed.temperature === 'number') {
            temperature.value = parsed.temperature;
            props.log(NS, `Loaded temperature from file.`);
          }
        } else {
          throw new Error('Invalid chat history format in file.');
        }
        const loadedMessages: AIMessage[] = loadedMessagesRaw.map((msg: any) => ({
            ...msg,
            isRawText: false
        }));

        messages.value = loadedMessages;
        currentFileMount.value = payload.mount;
        currentDirectoryPath.value = payload.path;
        currentFileName.value = payload.name;

        currentThinkingText.value = '';
        isThinkingExpanded.value = false;
        const lastLoadedMessage = messages.value[messages.value.length - 1];
        if (lastLoadedMessage && lastLoadedMessage.role === 'assistant' && lastLoadedMessage.thinkingLog) {
          currentThinkingText.value = lastLoadedMessage.thinkingLog;
          props.log(NS, `Loaded thinkingLog from last message.`);
        } else {
          props.log(NS, `No thinkingLog found in the last message or it was empty.`);
          if (lastLoadedMessage && lastLoadedMessage.role === 'assistant') {
             delete lastLoadedMessage.thinkingLog;
           }
        }

        props.log(NS, `Successfully loaded chat history from ${fullPath}`);
        scrollToBottom();
      } catch (error: any) {
        props.log(NS, `Error opening/reading chat file ${fullPath}: ${error.message}`, true);
      }
    } else if (payload.mode === 'save' && payload.name) {
      props.log(NS, `File Manager response (Save): Mount=${payload.mount}, Path=${payload.path}, Name=${payload.name}`);
      const fullPath = `${payload.path}/${payload.name}`.replace('//', '/');
      try {
        const messagesToSave = JSON.parse(JSON.stringify(messages.value));
        if (messagesToSave.length > 0) {
          const lastMessage = messagesToSave[messagesToSave.length - 1];
          if (lastMessage.role === 'assistant' && currentThinkingText.value) {
            lastMessage.thinkingLog = currentThinkingText.value;
            props.log(NS, `Adding thinkingLog to the last message for saving (Save As).`);
          }
        }

        // Include system prompt and temperature in saved data for Save As
        const dataToSave = { systemPrompt: systemPrompt.value, temperature: temperature.value, messages: messagesToSave };
        const contentToSave = JSON.stringify(dataToSave, null, 2);
        await writeFile(payload.mount, fullPath, contentToSave);
        currentFileMount.value = payload.mount;
        currentDirectoryPath.value = payload.path;
        currentFileName.value = payload.name;
        props.log(NS, `Successfully saved chat history to ${fullPath}`);
      } catch (error: any) {
        props.log(NS, `Error saving chat file to ${fullPath}: ${error.message}`, true);
      }
    }
  } else if (message.type === 'settings' && message.payload) {
    const payload = message.payload as SettingsMessagePayload;
    props.log(NS, `Settings received: Temp=${payload.temperature}, SystemPrompt=${payload.systemPrompt ? payload.systemPrompt : '<empty>'}`);
    temperature.value = payload.temperature;
    systemPrompt.value = payload.systemPrompt;
    props.log(NS, 'Chat settings updated.');
  } else {
    props.log(NS, `Received unhandled message type: ${message?.type ?? 'unknown'}`);
  }
}

defineExpose({ handleMessage });

onMounted(async () => {
  modelsLoading.value = true;
  modelsError.value = null;
  try {
    const modelsArray: GetModelsResponse = await getModels();
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

.icon-disabled {
  filter: grayscale(100%);
  opacity: 0.5;
}

button > span > svg {
  width: 1rem;
  height: 1rem;
}
</style> 