<template>
  <div class="ws-inspector">
    <div class="header">
      <h2>WebSocket Inspector</h2>
      <div class="actions">
        <button @click="clearOutgoing" class="btn-clear">Clear Outgoing</button>
        <button @click="clearIncoming" class="btn-clear">Clear Incoming</button>
      </div>
    </div>
    <div class="logs">
      <section class="log-section">
        <h3>Outgoing Messages ({{ outgoingLog.length }})</h3>
        <div v-if="!outgoingLog.length" class="no-messages">No outgoing messages.</div>
        <div v-else class="log-entries">
          <div v-for="(entry, idx) in limitedOutgoing" :key="idx" class="log-entry">
            <div class="timestamp">{{ formatTime(entry.timestamp) }}</div>
            <pre class="message">{{ formatJson({ route: entry.route, payload: entry.payload }) }}</pre>
          </div>
        </div>
      </section>
      <section class="log-section">
        <h3>Incoming Messages ({{ incomingLog.length }})</h3>
        <div v-if="!incomingLog.length" class="no-messages">No incoming messages.</div>
        <div v-else class="log-entries">
          <div v-for="(entry, idx) in limitedIncoming" :key="idx" class="log-entry">
            <div class="timestamp">{{ formatTime(entry.timestamp) }}</div>
            <pre class="message">{{ formatJson(entry.message) }}</pre>
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

<style scoped>
.ws-inspector {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #333;
  max-width: 100%;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.actions button {
  margin-left: 8px;
}

.log-section {
  margin-bottom: 24px;
}

.log-entries {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e1e4e8;
  border-radius: 4px;
  padding: 8px;
  background-color: #fafbfc;
}

.log-entry {
  margin-bottom: 12px;
}

.timestamp {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.message {
  margin: 0;
  background-color: #f6f8fa;
  padding: 8px;
  border-radius: 3px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 13px;
}

.no-messages {
  text-align: center;
  color: #666;
  padding: 16px;
}
</style>

