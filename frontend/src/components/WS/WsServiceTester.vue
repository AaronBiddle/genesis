<template>
  <div class="ws-tester">
    <h2>WebSocket Service Tester</h2>

    <div class="status-section">
      <strong>Status:</strong>
      <span :class="statusClass">{{ statusText }}</span>
      <button @click="handleConnect" :disabled="isConnecting || isConnected">Connect</button>
      <button @click="handleDisconnect" :disabled="!isConnected">Disconnect</button>
      <p v-if="connectionError" class="error">Error: {{ connectionError }}</p>
    </div>

    <div v-if="isConnected" class="interaction-section">
      <hr>
      <h3>Start New Interaction</h3>
      <div>
        <label for="ws-route">Route:</label>
        <input id="ws-route" type="text" v-model="routeToSend" placeholder="e.g., /echo">
      </div>
      <div>
        <label for="ws-payload">Payload (JSON):</label>
        <textarea id="ws-payload" v-model="payloadToSend" rows="4" placeholder='{ "message": "hello" }'></textarea>
      </div>
      <button @click="handleStartInteraction">Start Interaction</button>
      <p v-if="startInteractionError" class="error">{{ startInteractionError }}</p>

      <div v-if="Object.keys(activeInteractions).length > 0" class="active-interactions">
        <hr>
        <h3>Active Interactions</h3>
        <div v-for="(interaction, id) in activeInteractions" :key="id" class="interaction-item">
          <h4>Interaction ID: {{ id }} (Route: {{ interaction.route }})</h4>
          <button @click="handleStopInteraction(Number(id))">Stop Interaction</button>
          <div class="messages">
            <h5>Received Messages:</h5>
            <pre v-if="interaction.messages.length > 0">{{ JSON.stringify(interaction.messages, null, 2) }}</pre>
            <p v-else>No messages received yet.</p>
            <p v-if="interaction.error" class="error">Error: {{ interaction.error }}</p>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
// Remove the old import block entirely

// Import the client instance and types separately with correct path casing
import { wsAiClient } from '@/services/WS/WsAiClient';
import { WebSocketStatus } from '@/services/WS/types';
import type { InteractionCallback, InteractionMessage } from '@/services/WS/types';
import { log } from "@/components/Logger/loggerStore"; // Import the logger

// Define the namespace for this component
const NS = "WsServiceTester.vue";

interface ActiveInteraction {
  route: string;
  messages: any[];
  error: any | null;
}

const routeToSend = ref('/'); // Default route
const payloadToSend = ref('{ "message": "hello" }');
const connectionError = ref<string | null>(null);
const startInteractionError = ref<string | null>(null);

// Use the status ref directly from the client instance
const wsStatus = wsAiClient.status;

// Store active interactions: key is interactionId (string for reactivity keys), value is details
const activeInteractions = reactive<Record<string, ActiveInteraction>>({});

// --- Computed Properties for Status --- 
const isConnecting = computed(() => wsStatus.value === WebSocketStatus.Connecting);
const isConnected = computed(() => wsStatus.value === WebSocketStatus.Connected);

const statusText = computed(() => {
  switch (wsStatus.value) {
    case WebSocketStatus.Connecting: return 'Connecting...';
    case WebSocketStatus.Connected: return 'Connected';
    case WebSocketStatus.Disconnected: return 'Disconnected';
    case WebSocketStatus.Error: return 'Error';
    default: return 'Unknown';
  }
});

const statusClass = computed(() => {
  switch (wsStatus.value) {
    case WebSocketStatus.Connected: return 'status-connected';
    case WebSocketStatus.Error: return 'status-error error';
    default: return 'status-disconnected';
  }
});

// --- WebSocket Actions ---

const handleConnect = async () => {
  connectionError.value = null;
  log(NS, 'Attempting to connect...');
  try {
    // Use the client's connect method
    await wsAiClient.connect();
    log(NS, 'Connection promise resolved.');
  } catch (error: any) {
    log(NS, `Connection failed: ${error}`, true);
    connectionError.value = error.message || 'Failed to connect';
  }
};

const handleDisconnect = () => {
  log(NS, 'Disconnecting...');
  // Use the client's disconnect method
  wsAiClient.disconnect();
};

const handleStartInteraction = () => {
  startInteractionError.value = null;
  let payload: any;

  try {
    payload = JSON.parse(payloadToSend.value);
  } catch (e) {
    startInteractionError.value = 'Invalid JSON payload.';
    return;
  }

  const route = routeToSend.value || '/';

  // Define the callback for this specific interaction
  const callback: InteractionCallback = (message: InteractionMessage) => {
    const interactionIdStr = interactionId?.toString(); // Get ID from closure
    if (!interactionIdStr || !activeInteractions[interactionIdStr]) return; // Interaction might have been stopped

    log(NS, `Received message for interaction ${interactionIdStr}: ${JSON.stringify(message)}`);

    if (message.data) {
      activeInteractions[interactionIdStr].messages.push(message.data);
    }
    if (message.error) {
      activeInteractions[interactionIdStr].error = message.error;
      // Optionally stop interaction on error?
      // handleStopInteraction(Number(interactionIdStr));
    }
    // Handle isComplete if added to InteractionMessage later
  };

  // Start the interaction using the client's method
  const interactionId = wsAiClient.startInteraction(route, payload, callback);

  if (interactionId !== null) {
    log(NS, `Interaction ${interactionId} started.`);
    // Initialize entry in reactive state
    activeInteractions[interactionId.toString()] = {
      route: route,
      messages: [],
      error: null,
    };
    // Clear input for next message
    // payloadToSend.value = ''; 
  } else {
    startInteractionError.value = 'Failed to start interaction. Is WebSocket connected?';
  }
};

const handleStopInteraction = (id: number) => {
  // Use the client's stopInteraction method
  if (wsAiClient.stopInteraction(id)) {
    // Remove from our local reactive state if successfully stopped in service
    delete activeInteractions[id.toString()];
    log(NS, `Interaction ${id} stopped and removed from UI.`);
  } else {
    log(NS, `Failed to stop interaction ${id} in service (maybe already stopped?).`, true);
     // Optionally remove from UI anyway if it exists?
     if (activeInteractions[id.toString()]) {
         delete activeInteractions[id.toString()];
     }
  }
};

// --- Watchers --- 
// Clear interactions when WebSocket disconnects or errors
watch(wsStatus, (newStatus) => {
  if (newStatus === WebSocketStatus.Disconnected || newStatus === WebSocketStatus.Error) {
    // Clear local state as the service map is also cleared
    Object.keys(activeInteractions).forEach(key => delete activeInteractions[key]);
  }
});

</script>

<style scoped>
.ws-tester {
  border: 1px solid #ccc;
  padding: 15px;
  margin: 10px;
  font-family: sans-serif;
}

.status-section button {
  margin-left: 10px;
}

.status-section span {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 4px;
  margin-left: 5px;
  font-weight: bold;
}

.status-connected {
  background-color: lightgreen;
  color: darkgreen;
}

.status-disconnected {
  background-color: lightgray;
  color: darkslategray;
}

.status-error {
  background-color: lightcoral;
  color: darkred;
}

.interaction-section {
  margin-top: 15px;
}

.interaction-section h3 {
  margin-bottom: 10px;
}

.interaction-section div {
  margin-bottom: 10px;
}

.interaction-section label {
  display: block;
  margin-bottom: 3px;
  font-weight: bold;
}

.interaction-section input[type="text"],
.interaction-section textarea {
  width: 95%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.interaction-section button {
  padding: 8px 15px;
  cursor: pointer;
}

.active-interactions {
  margin-top: 20px;
}

.interaction-item {
  border: 1px dashed #eee;
  padding: 10px;
  margin-bottom: 10px;
  background-color: #f9f9f9;
}

.interaction-item h4 {
  margin-top: 0;
  margin-bottom: 5px;
}

.interaction-item button {
  margin-left: 10px;
  float: right;
  background-color: #fdd;
  border: 1px solid #faa;
}

.messages {
  margin-top: 10px;
  background-color: #fff;
  padding: 8px;
  border: 1px solid #ddd;
  max-height: 200px;
  overflow-y: auto;
}

.messages pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
}

.error {
  color: red;
  font-weight: bold;
  margin-top: 5px;
}
</style>
