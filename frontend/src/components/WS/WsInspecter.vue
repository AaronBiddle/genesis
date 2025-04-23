<template>
  <div class="p-4 h-full flex flex-col bg-gray-50 text-gray-800 antialiased">
    <div class="flex justify-between items-center pb-3 mb-3 border-b border-gray-200 flex-shrink-0">
      <h2 class="text-lg font-semibold">WebSocket Inspector</h2>
      <div class="actions space-x-2">
        <button @click="clearOutgoing" class="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300">Clear Outgoing</button>
        <button @click="clearIncoming" class="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300">Clear Incoming</button>
      </div>
    </div>
    <div class="flex flex-col lg:flex-row gap-4 flex-grow overflow-hidden">
      <section class="log-section flex flex-col h-full lg:w-1/2">
        <h3 class="text-md font-medium mb-2 flex-shrink-0">Outgoing Messages ({{ outgoingLog.length }})</h3>
        <div v-if="!outgoingLog.length" class="no-messages flex-grow flex items-center justify-center text-center text-gray-500 italic p-4 border border-gray-200 rounded bg-white">No outgoing messages.</div>
        <div v-else class="log-entries flex-grow overflow-y-auto border border-gray-200 rounded p-2 bg-white space-y-3">
          <div v-for="(entry, idx) in limitedOutgoing" :key="idx" class="log-entry">
            <div class="timestamp text-xs text-gray-500 mb-1">{{ formatTime(entry.timestamp) }}</div>
            <pre class="message font-mono text-sm bg-gray-100 p-2 rounded-sm whitespace-pre-wrap overflow-x-auto">{{ formatJson({ route: entry.route, payload: entry.payload }) }}</pre>
          </div>
        </div>
      </section>
      <section class="log-section flex flex-col h-full lg:w-1/2">
        <h3 class="text-md font-medium mb-2 flex-shrink-0">Incoming Messages ({{ incomingLog.length }})</h3>
        <div v-if="!incomingLog.length" class="no-messages flex-grow flex items-center justify-center text-center text-gray-500 italic p-4 border border-gray-200 rounded bg-white">No incoming messages.</div>
        <div v-else class="log-entries flex-grow overflow-y-auto border border-gray-200 rounded p-2 bg-white space-y-3">
          <div v-for="(entry, idx) in limitedIncoming" :key="idx" class="log-entry">
            <div class="timestamp text-xs text-gray-500 mb-1">{{ formatTime(entry.timestamp) }}</div>
            <pre class="message font-mono text-sm bg-gray-100 p-2 rounded-sm whitespace-pre-wrap overflow-x-auto">{{ formatJson(entry.message) }}</pre>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { wsSendLog, wsReceiveLog } from '@/services/WS/WsInspectorClient';

const outgoingLog = wsSendLog;
const incomingLog = wsReceiveLog;

const MAX_ENTRIES = 50;
const limitedOutgoing = computed(() => outgoingLog.value.slice(-MAX_ENTRIES));
const limitedIncoming = computed(() => incomingLog.value.slice(-MAX_ENTRIES));

const clearOutgoing = () => { wsSendLog.value = []; };
const clearIncoming = () => { wsReceiveLog.value = []; };

const formatTime = (date: Date) => {
  try {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return String(date);
  }
};

const formatJson = (obj: any) => {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
};
</script>

