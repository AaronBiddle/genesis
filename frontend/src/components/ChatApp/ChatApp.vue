<template>
  <div class="flex flex-col h-full">
    <!-- ───────────────────────── Toolbar ───────────────────────── -->
    <div class="bg-gray-100 p-2 border-b flex items-center space-x-2">
      <!-- File actions -->
      <button class="p-1 hover:bg-gray-200 rounded" @click="handleNewClick">
        <img src="@/components/Icons/icons8/icons8-new-file-80.png" alt="New Chat" class="h-6 w-6" />
      </button>
      <button class="p-1 hover:bg-gray-200 rounded" @click="openFileDialog">
        <img src="@/components/Icons/icons8/icons8-open-file-80.png" alt="Open Chat" class="h-6 w-6" />
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
        />
      </button>
      <button class="p-1 hover:bg-gray-200 rounded ml-1" @click="saveAsDialog">
        <img src="@/components/Icons/icons8/icons8-save-as-80.png" alt="Save Chat As" class="h-6 w-6" />
      </button>

      <div class="w-px h-6 bg-gray-300 mx-2" />

      <!-- Model select -->
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

      <!-- Settings -->
      <button class="p-1 hover:bg-gray-200 rounded ml-auto" @click="handleSettingsClick" title="Settings">
        <span v-html="svgIcons.get('settings')" />
      </button>
    </div>

    <!-- ──────────────────────── Message list & input ─────────────────────── -->
    <div class="flex flex-col flex-grow h-full bg-gray-50 p-2 overflow-hidden">
      <!-- Messages -->
      <div ref="messageContainer" class="flex-grow overflow-y-auto mb-2 space-y-2 pr-2">
        <div
          v-for="(message, index) in messages"
          :key="index"
          :class="getMessageClass(message)"
          class="flex items-start"
        >
          <div
            class="px-3 py-2 rounded-lg relative max-w-full"
            :class="[
              message.role === 'user' ? 'bg-cyan-500 text-white ml-12' : 'bg-gray-200 text-gray-800',
            ]"
          >
            <template v-if="message.role === 'assistant'">
              <div
                v-if="currentThinkingText.length > 0 && index === messages.length - 1"
                class="mb-2 border-b border-gray-300 pb-1"
              >
                <button
                  @click="isThinkingExpanded = !isThinkingExpanded"
                  class="text-xs text-gray-500 hover:text-gray-700 flex items-center w-full text-left"
                >
                  <span class="font-medium">Thinking...</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-3 w-3 ml-1 transition-transform duration-200"
                    :class="{ 'rotate-90': isThinkingExpanded }"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </button>
                <div v-show="isThinkingExpanded" class="mt-1">
                  <pre class="text-xs text-gray-500 font-mono whitespace-pre-wrap bg-gray-100 p-1 rounded">{{ currentThinkingText }}</pre>
                </div>
              </div>

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

          <button
            v-if="message.role === 'assistant'"
            @click="message.isRawText = !message.isRawText"
            class="p-0.5 bg-gray-200 hover:bg-gray-300 rounded text-gray-600 hover:text-gray-800 z-10 sticky flex-shrink-0 ml-1 mr-12"
            :title="message.isRawText ? 'Show Rendered Markdown' : 'Show Raw Text'"
            style="top: 4px;"
          >
            <span v-if="message.isRawText" v-html="svgIcons.get('eye')" />
            <span v-else v-html="svgIcons.get('tag')" />
          </button>
        </div>
      </div>

      <!-- Input area -->
      <div class="pt-2">
        <div class="flex items-center" @focusin="handleFocusIn" @focusout="handleFocusOut">
          <textarea
            ref="textareaRef"
            v-model="newMessage"
            placeholder="Type your message (Shift+Enter for newline)..."
            class="flex-grow p-2 resize-none outline-none"
            :class="{
              'border border-black rounded-l-md': !isInputAreaFocused,
              'border-2 border-cyan-500 rounded-l-md': isInputAreaFocused,
            }"
            @keydown.enter.exact.prevent="isLoading ? cancelStream() : sendMessage()"
            :disabled="isLoading"
            rows="4"
          />
          <button
            ref="sendButtonRef"
            @click="isLoading ? cancelStream() : sendMessage()"
            :disabled="(!newMessage.trim() && !isLoading) || currentInteractionId !== null"
            class="text-white px-3 py-2 flex items-center justify-center self-stretch outline-none bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-300 disabled:hover:bg-gray-300"
            :class="{
              'border border-l-0 border-black rounded-r-md': !isInputAreaFocused,
              'border-2 border-l-0 border-cyan-500 rounded-r-md': isInputAreaFocused,
            }"
          >
            <svg v-if="isLoading" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-6 w-6 text-red-400">
              <path fill-rule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clip-rule="evenodd" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-6 w-6">
              <path fill-rule="evenodd" d="M3 16.5L12 16.5V22.5L21 12 12 1.5V7.5L3 7.5z" clip-rule="evenodd" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/* ───────────────────── Imports ───────────────────── */
import {
  ref,
  reactive,
  nextTick,
  onMounted,
  computed,
  inject,
} from 'vue';
import MarkdownRenderer from '@/components/Markdown/MarkdownRenderer.vue';
import { getModels, type GetModelsResponse, type ModelDetails } from '@/services/HTTP/HttpAIClient';
import { readFile, writeFile } from '@/services/HTTP/HttpFileClient';
import { WsAiClient } from '@/services/WS/WsAiClient';
import type { AiChatPayload } from '@/services/WS/WsAiClient';
import type { InteractionMessage } from '@/services/WS/types';
import { svgIcons } from '@/components/Icons/SvgIcons';

/* ───────────────────── WindowBus types ───────────────────── */
interface FileDialogOptions {
  mode: 'open' | 'save';
  mimeFilter?: string[];
  suggestedName?: string;
}
interface WindowBus {
  requestFile: (
    opts: FileDialogOptions,
  ) => Promise<
    | { cancelled: true }
    | { cancelled: false; mount: string; path: string; name: string }
  >;
}

const bus = inject<WindowBus>('windowBus')!;

/* ───────────────────── Props / Emits / Constants ───────────────────── */
const props = defineProps<{
  log: (ns: string, msg: string, err?: boolean) => void;
  newWindow: (id: string, opts?: any) => void; // settings window
}>();
const emit = defineEmits<{ (e: 'updateTitle', title: string): void }>();
const NS = 'ChatApp.vue';

/* ───────────────────── Chat message types ───────────────────── */
interface AIMessageBase { role: 'user' | 'assistant'; content: string }
interface AIMessage extends AIMessageBase { isRawText?: boolean; thinkingLog?: string }

/* ───────────────────── Reactive State ───────────────────── */
// messages & UI
const messages = ref<AIMessage[]>([]);
const newMessage = ref('');
const messageContainer = ref<HTMLElement | null>(null);
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const sendButtonRef = ref<HTMLButtonElement | null>(null);
const isLoading = ref(false);
const isInputAreaFocused = ref(false);

// AI streaming
const currentInteractionId = ref<number | null>(null);
const currentThinkingText = ref('');
const isThinkingExpanded = ref(false);

// AI settings
const temperature = ref(0.7);
const systemPrompt = ref('You are a helpful assistant.');

// File‑context
const current = reactive<{ dir: string | null; name: string | null; mount: string | null }>({
  dir: null,
  name: null,
  mount: null,
});
const canSaveDirectly = computed(() => !!current.mount && !!current.dir && !!current.name);

// Models list
const availableModels = ref<Record<string, ModelDetails>>({});
const selectedModel = ref('');
const modelsLoading = ref(true);
const modelsError = ref<string | null>(null);

/* ───────────────────── Helper Functions ───────────────────── */
const scrollToBottom = () => {
  nextTick(() => {
    if (!messageContainer.value) return;
    const el = messageContainer.value;
    const nearBottom = el.scrollHeight - el.clientHeight <= el.scrollTop + 10;
    if (nearBottom) el.scrollTop = el.scrollHeight;
  });
};

const getMessageClass = (m: AIMessage) => (m.role === 'user' ? 'flex justify-end' : 'flex justify-start');

function addMessage(content: string, role: 'user' | 'assistant') {
  messages.value.push({ content, role });
  scrollToBottom();
}

function updateAssistantMessage(chunk: string) {
  if (messages.value.length && messages.value[messages.value.length - 1].role === 'assistant') {
    messages.value[messages.value.length - 1].content += chunk;
  } else {
    addMessage(chunk, 'assistant');
  }
  scrollToBottom();
}

/* ───────────────────── Focus Handling ───────────────────── */
function handleFocusIn() { isInputAreaFocused.value = true; }
function handleFocusOut() {
  setTimeout(() => {
    if (document.activeElement !== textareaRef.value && document.activeElement !== sendButtonRef.value) {
      isInputAreaFocused.value = false;
    }
  }, 0);
}

/* ───────────────────── AI send / stream / cancel ───────────────────── */
async function sendMessage() {
  const text = newMessage.value.trim();
  if (!text || currentInteractionId.value !== null) return;

  addMessage(text, 'user');
  newMessage.value = '';
  isLoading.value = true;
  addMessage('', 'assistant');

  const payload: AiChatPayload = {
    model: selectedModel.value,
    messages: messages.value.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
    stream: true,
    temperature: temperature.value,
    system_prompt: systemPrompt.value || undefined,
  };

  try {
    const interactionId = await WsAiClient.sendChatMessage(
      payload,
      (msg: InteractionMessage) => {
        if (msg.error) {
          props.log(NS, `WS error: ${msg.error}`, true);
          updateAssistantMessage(`\n\n--- Error: ${msg.error} ---`);
          finishInteraction();
        } else if (msg.thinking) {
          currentThinkingText.value += msg.thinking;
        } else if (msg.text) {
          updateAssistantMessage(msg.text);
        } else if (msg.meta) {
          finishInteraction();
        }
      },
    );

    if (interactionId !== null) currentInteractionId.value = interactionId;
    else finishInteraction();
  } catch (e: any) {
    props.log(NS, `WS send failed: ${e.message}`, true);
    messages.value.pop();
    addMessage(`Error: ${e.message}`, 'assistant');
    finishInteraction();
  }
}

function finishInteraction() {
  isLoading.value = false;
  currentInteractionId.value = null;
  currentThinkingText.value = '';
  isThinkingExpanded.value = false;
}

function cancelStream() {
  if (currentInteractionId.value === null) return;
  WsAiClient.cancelChat(currentInteractionId.value);
  finishInteraction();
}

/* ───────────────────── File‑dialog helpers ───────────────────── */
async function openFileDialog() {
  props.log(NS, 'Open dialog');
  const res = await bus.requestFile({ mode: 'open', mimeFilter: ['application/json'] });
  if (res.cancelled) return;
  try {
    const raw = await readFile(res.mount, `${res.path}/${res.name}`);
    const parsed = JSON.parse(raw);
    messages.value = Array.isArray(parsed) ? parsed : parsed.messages || [];
    if (!Array.isArray(parsed)) {
      temperature.value = parsed.temperature ?? temperature.value;
      systemPrompt.value = parsed.systemPrompt ?? systemPrompt.value;
    }
    Object.assign(current, { mount: res.mount, dir: res.path, name: res.name });
    emit('updateTitle', `${res.name} - Chat`);
    scrollToBottom();
  } catch (e: any) {
    props.log(NS, `Open failed: ${e.message}`, true);
  }
}

async function saveTo(mount: string, fullPath: string) {
  const out = JSON.stringify({ systemPrompt: systemPrompt.value, temperature: temperature.value, messages: messages.value }, null, 2);
  await writeFile(mount, fullPath, out);
  props.log(NS, `Saved to ${fullPath}`);
}

async function saveAsDialog() {
  const tgt = await bus.requestFile({ mode: 'save', suggestedName: current.name ?? 'chat.json' });
  if (tgt.cancelled) return;
  await saveTo(tgt.mount, `${tgt.path}/${tgt.name}`);
  Object.assign(current, { mount: tgt.mount, dir: tgt.path, name: tgt.name });
  emit('updateTitle', `${tgt.name} - Chat`);
}

async function handleSaveClick() {
  if (canSaveDirectly.value && current.mount && current.dir && current.name) {
    await saveTo(current.mount, `${current.dir}/${current.name}`);
  } else {
    await saveAsDialog();
  }
}

/* ───────────────────── Toolbar miscellany ───────────────────── */
function handleNewClick() {
  messages.value = [];
  Object.assign(current, { dir: null, name: null, mount: null });
  temperature.value = 0.7;
  systemPrompt.value = 'You are a helpful assistant.';
  currentThinkingText.value = '';
  emit('updateTitle', 'New Chat');
}

function handleSettingsClick() {
  props.newWindow('chat-settings', { initialTemperature: temperature.value, initialSystemPrompt: systemPrompt.value });
}

/* ───────────────────── EventBus handler (only settings) ───────────────────── */
interface SettingsMessagePayload { temperature: number; systemPrompt: string }
interface SettingsMessage { type: 'settings'; payload: SettingsMessagePayload }
function handleMessage(_sid: number, msg: SettingsMessage | any) {
  if (msg.type === 'settings') {
    temperature.value = msg.payload.temperature;
    systemPrompt.value = msg.payload.systemPrompt;
    props.log(NS, 'Settings updated');
  }
}

defineExpose({ handleMessage });

/* ───────────────────── onMounted ───────────────────── */
onMounted(async () => {
  try {
    const arr: GetModelsResponse = await getModels();
    arr.forEach(m => (availableModels.value[m.name] = m));
    const keys = Object.keys(availableModels.value);
    if (keys.length) selectedModel.value = keys[0];
  } catch (e: any) {
    modelsError.value = e.message || 'Failed to fetch models';
  } finally {
    modelsLoading.value = false;
  }
  emit('updateTitle', 'Chat');
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