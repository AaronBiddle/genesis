<template>
  <div class="http-inspector">
        
    <!-- Controls -->
    <div class="controls">
      <div class="toggles">
        <!-- Mode selector -->
        <div class="mode-selector">
          <div class="mode-label"></div>
          <div class="mode-toggle">
            <button
              @click="previewMode = false"
              :class="{ active: !previewMode }"
              class="mode-button send-mode"
            >
              <span class="mode-icon">↗</span>
              Send Requests
            </button>
            <button
              @click="previewMode = true"
              :class="{ active: previewMode }"
              class="mode-button preview-mode"
            >
              <span class="mode-icon">👁️</span>
              Preview Only
            </button>
          </div>
        </div>
      </div>
      
      <div class="actions">
        <button @click="clearLog" class="btn-clear">Clear Log</button>
        <button @click="testEchoRequest" class="btn-test">Test Echo Request</button>
      </div>
    </div>
    
    <!-- Request Log Status Bar -->
    <div class="status-bar">
      <div class="status-indicator" :class="{ 'status-preview': previewMode, 'status-live': !previewMode }">
        {{ previewMode ? 'PREVIEW MODE: Requests will not be sent to the server' : 'LIVE MODE: Requests will be sent to the server' }}
      </div>
    </div>
    
    <!-- Request Log -->
    <div class="request-log">
      <h3>Request Log <span v-if="requestLog.length">({{ requestLog.length }})</span></h3>
      
      <div v-if="!requestLog.length" class="no-requests">
        No requests logged yet. Toggle "Log Requests" and make some HTTP requests.
      </div>
      
      <div v-else class="requests-container">
        <div v-for="(entry, index) in displayedLog" :key="entry.id" class="request-entry" :class="{ 'blocked': isUnsuccessfulRequest(entry) }">
          <div class="request-header" @click="toggleEntryExpanded(index)">
            <div class="method" :class="entry.method.toLowerCase()">{{ entry.method }}</div>
            <div class="path">{{ entry.path }}</div>
            <div class="timestamp">{{ formatTime(entry.timestamp) }}</div>
            <div class="status-badge" :class="entry.status">
                {{ entry.status === 'sending' ? 'Sending...' : 
                   entry.status === 'error' ? 'Error' : 
                   entry.status === 'blocked' ? 'Blocked' : 
                   entry.status === 'sent' ? 'Sent' : entry.status }}
            </div>
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
            
            <!-- Response section -->
            <div v-if="entry.responseStatus !== undefined" class="response-section">
              <h4>Response</h4>
              
              <div class="detail-row">
                <div class="detail-key">Status:</div>
                <div class="detail-value response-status" :class="getStatusClass(entry.responseStatus)">
                  {{ entry.responseStatus }} {{ entry.responseStatusText }}
                </div>
              </div>
              
              <div class="detail-row">
                <div class="detail-key">Time:</div>
                <div class="detail-value">{{ entry.responseTime ? formatTime(new Date(entry.responseTime).toISOString()) : 'N/A' }}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-key">Headers:</div>
                <div class="detail-value">
                  <pre>{{ formatJson(entry.responseHeaders || {}) }}</pre>
                </div>
              </div>
              
              <div v-if="entry.responseBody" class="detail-row">
                <div class="detail-key">Body:</div>
                <div class="detail-value">
                  <pre>{{ formatJson(entry.responseBody) }}</pre>
                </div>
              </div>
            </div>
            
            <!-- Error section -->
            <div v-if="entry.error" class="error-section">
              <h4>Error</h4>
              <div class="detail-row">
                <div class="detail-key">Message:</div>
                <div class="detail-value error-message">{{ entry.error }}</div>
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
import { sendRequests as httpSendRequests, requestLog as httpRequestLog, post } from '@/services/HttpClient';

// Preview mode is the opposite of sendRequests
const previewMode = computed({
  get: () => !httpSendRequests.value,
  set: (value) => { httpSendRequests.value = !value; }
});

// Read-only computed property for the log
const requestLog = computed(() => httpRequestLog.value);

// Add new computed property to check for unsuccessful requests
const isUnsuccessfulRequest = (entry: any) => {
  return entry.status === 'blocked' || 
         (entry.responseStatus !== undefined && (entry.responseStatus >= 400 || entry.error));
};

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
    
    // Send the request - target your actual echo endpoint
    await post('/frontend/echo', payload);
    
  } catch (err: any) {
    console.error('Echo test failed:', err.message);
    // Avoid alert if request was blocked
    if (err.message && !err.message.includes("Blocked by Client Control")) {
        alert(`Echo test failed: ${err.message}`);
    }
  }
};

// Displayed log entries (could add filtering/sorting here)
const displayedLog = computed(() => {
  // Return a reversed copy to show newest first
  return [...requestLog.value].reverse();
});

// Helper to determine status color class
const getStatusClass = (status: number) => {
  if (status >= 200 && status < 300) return 'status-success';
  if (status >= 300 && status < 400) return 'status-redirect';
  if (status >= 400 && status < 500) return 'status-client-error';
  if (status >= 500) return 'status-server-error';
  return '';
};
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
  display: flex;
  flex-direction: column;
  height: 100%;
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
  align-items: center;
  gap: 20px;
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
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
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
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
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

.status-badge.sending {
  background-color: #e1f5fe; /* Light blue */
  color: #0277bd; /* Darker blue */
  animation: pulse 1.5s infinite ease-in-out;
}

.status-badge.error {
    background-color: #ffebee; /* Same as blocked for consistency */
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

.response-section, .error-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #e1e4e8;
}

.response-section h4, .error-section h4 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #586069;
}

.response-status {
  font-weight: 600;
}

.status-success {
  color: #22863a;
}

.status-redirect {
  color: #6f42c1;
}

.status-client-error {
  color: #cb2431;
}

.status-server-error {
  color: #d73a49;
}

.error-message {
  color: #cb2431;
  font-weight: 500;
}

/* New mode selector styles */
.mode-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mode-label {
  font-weight: 500;
}

.mode-toggle {
  display: flex;
  border-radius: 6px;
  border: 1px solid #d1d5da;
  overflow: hidden;
}

.mode-button {
  border: none;
  background-color: #fff;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: background-color 0.2s, color 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.mode-button:hover:not(.active) {
  background-color: #f1f2f4;
}

.mode-button.active {
  color: #fff;
  cursor: default;
}

.mode-button.active.send-mode {
  background-color: #2188ff;
}

.mode-button.active.preview-mode {
  background-color: #e36209;
}

.mode-icon {
  font-size: 14px;
}

/* Status bar styles */
.status-bar {
  margin: 16px 0 8px;
}

.status-indicator {
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  transition: background-color 0.3s;
}

.status-preview {
  background-color: #fff8e1;
  color: #b45309;
}

.status-live {
  background-color: #e8f5e9;
  color: #1b5e20;
}

/* Add keyframes for pulse animation */
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.6; }
  100% { opacity: 1; }
}
</style> 