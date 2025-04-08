<template>
  <div class="http-inspector">
    <h2>HTTP Inspector</h2>
    
    <!-- Controls -->
    <div class="controls">
      <div class="toggles">
        <label class="toggle">
          <input type="checkbox" v-model="logRequests" />
          <span>Log Requests</span>
        </label>
        
        <label class="toggle">
          <input type="checkbox" v-model="sendRequests" />
          <span>{{ sendRequests ? 'Requests Enabled' : 'Requests Paused' }}</span>
        </label>
      </div>
      
      <div class="actions">
        <button @click="clearLog" class="btn-clear">Clear Log</button>
        <button @click="testEchoRequest" class="btn-test">Test Echo Request</button>
      </div>
    </div>
    
    <!-- Request Log -->
    <div class="request-log">
      <h3>Request Log <span v-if="requestLog.length">({{ requestLog.length }})</span></h3>
      
      <div v-if="!requestLog.length" class="no-requests">
        No requests logged yet. Toggle "Log Requests" and make some HTTP requests.
      </div>
      
      <div v-else class="requests-container">
        <div v-for="(entry, index) in displayedLog" :key="entry.id" class="request-entry" :class="{ 'blocked': entry.status === 'blocked' }">
          <div class="request-header" @click="toggleEntryExpanded(index)">
            <div class="method" :class="entry.method.toLowerCase()">{{ entry.method }}</div>
            <div class="path">{{ entry.path }}</div>
            <div class="timestamp">{{ formatTime(entry.timestamp) }}</div>
            <div class="status-badge" :class="entry.status">{{ entry.status }}</div>
            <div class="expand-icon">{{ expandedEntries[index] ? '▼' : '►' }}</div>
          </div>
          
          <!-- Expanded details -->
          <div v-if="expandedEntries[index]" class="request-details">
            <div class="detail-row">
              <div class="detail-key">URL:</div>
              <div class="detail-value">{{ entry.url }}</div>
            </div>
            
            <div v-if="entry.body" class="detail-row">
              <div class="detail-key">Body:</div>
              <div class="detail-value">
                <pre>{{ formatJson(entry.body) }}</pre>
              </div>
            </div>
            
            <div class="detail-row">
              <div class="detail-key">Headers:</div>
              <div class="detail-value">
                <pre>{{ formatJson(entry.options.headers || {}) }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { logRequests as httpLogRequests, sendRequests as httpSendRequests, requestLog as httpRequestLog, post } from '@/services/HttpClient';

// Two-way binding with HttpClient reactive variables
const logRequests = computed({
  get: () => httpLogRequests.value,
  set: (value) => { httpLogRequests.value = value; }
});

const sendRequests = computed({
  get: () => httpSendRequests.value,
  set: (value) => { httpSendRequests.value = value; }
});

// Read-only computed property for the log
const requestLog = computed(() => httpRequestLog.value);

// Track which entries are expanded
const expandedEntries = ref<Record<number, boolean>>({});

// Helper function to format timestamps
const formatTime = (isoString: string) => {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch (e) {
    return isoString;
  }
};

// Helper to format JSON nicely
const formatJson = (obj: any) => {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return String(obj);
  }
};

// Toggle expansion state for a request entry
const toggleEntryExpanded = (index: number) => {
  expandedEntries.value = {
    ...expandedEntries.value,
    [index]: !expandedEntries.value[index]
  };
};

// Clear the request log
const clearLog = () => {
  httpRequestLog.value.length = 0;
};

// Test function to send an echo request
const testEchoRequest = async () => {
  try {
    const payload = {
      message: "Test from HTTP Inspector",
      timestamp: new Date().toISOString()
    };
    
    // Make sure logging is enabled for the test
    const wasLoggingEnabled = logRequests.value;
    if (!wasLoggingEnabled) {
      logRequests.value = true;
    }
    
    // Send the request - target your actual echo endpoint
    await post('/frontend/echo', payload);
    
    // Restore previous logging state if needed
    if (!wasLoggingEnabled) {
      logRequests.value = wasLoggingEnabled;
    }
  } catch (err: any) {
    console.error('Echo test failed:', err.message);
    alert(`Echo test failed: ${err.message}`);
  }
};

// Displayed log entries (could add filtering/sorting here)
const displayedLog = computed(() => {
  // Return a reversed copy to show newest first
  return [...requestLog.value].reverse();
});
</script>

<style scoped>
.http-inspector {
  background-color: #f7f8fa;
  border-radius: 8px;
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #333;
  max-width: 100%;
  overflow: hidden;
}

h2, h3 {
  margin-top: 0;
  font-weight: 600;
}

.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e1e4e8;
}

.toggles {
  display: flex;
  gap: 16px;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.actions {
  display: flex;
  gap: 8px;
}

button {
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid #d1d5da;
  background-color: #fff;
  cursor: pointer;
  font-size: 14px;
}

button:hover {
  background-color: #f1f2f4;
}

.btn-clear {
  color: #e36209;
}

.btn-test {
  color: #2188ff;
}

.request-log {
  margin-top: 16px;
}

.no-requests {
  text-align: center;
  padding: 32px;
  color: #666;
  background-color: #fff;
  border-radius: 4px;
  border: 1px dashed #d1d5da;
}

.requests-container {
  background-color: #fff;
  border-radius: 4px;
  border: 1px solid #e1e4e8;
  max-height: 500px;
  overflow-y: auto;
}

.request-entry {
  border-bottom: 1px solid #e1e4e8;
}

.request-entry.blocked {
  background-color: #ffeef0;
}

.request-header {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  cursor: pointer;
}

.request-header:hover {
  background-color: #f6f8fa;
}

.method {
  width: 70px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 3px;
  text-align: center;
  background-color: #eee;
}

.method.get { background-color: #e3f2fd; color: #0d47a1; }
.method.post { background-color: #e8f5e9; color: #1b5e20; }
.method.put { background-color: #fff8e1; color: #f57f17; }
.method.delete { background-color: #ffebee; color: #b71c1c; }

.path {
  flex: 1;
  margin-left: 16px;
  margin-right: 16px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timestamp {
  color: #666;
  margin-right: 16px;
}

.status-badge {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.sent {
  background-color: #e8f5e9;
  color: #1b5e20;
}

.status-badge.blocked {
  background-color: #ffebee;
  color: #b71c1c;
}

.expand-icon {
  margin-left: 8px;
  color: #586069;
}

.request-details {
  padding: 16px;
  background-color: #fafbfc;
  border-top: 1px solid #eaecef;
}

.detail-row {
  margin-bottom: 12px;
  display: flex;
}

.detail-key {
  width: 80px;
  font-weight: 600;
  color: #586069;
}

.detail-value {
  flex: 1;
  overflow-x: auto;
}

pre {
  margin: 0;
  background-color: #f6f8fa;
  padding: 8px;
  border-radius: 3px;
  color: #24292e;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}
</style> 