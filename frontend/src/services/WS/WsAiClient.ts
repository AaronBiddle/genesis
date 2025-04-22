import { createWebSocketClient } from './WsClientFactory';
import type { WsClient } from './WsClientFactory';
import type { InteractionCallback } from './types'; // Import needed types
import type { Ref } from 'vue'; // Import Ref if exposing status
import { WebSocketStatus } from './types'; // Import status enum
import { log } from "@/components/Logger/loggerStore";

// Define the structure expected by the backend's ChatRequest (excluding request_id)
export interface AiChatPayload {
  model: string;
  system_prompt?: string | null;
  messages: Array<{ role: string; content: string }>;
  stream?: boolean;
  temperature?: number | null;
}

// Internal WsClient instance
const internalClient: WsClient = createWebSocketClient('/frontend/ws/chat');

// --- Exposed API ---

/**
 * Sends a chat message payload to the AI backend via WebSocket.
 * Ensures the WebSocket is connected before sending.
 * @param payload The chat message data (model, messages, etc.).
 * @param callback The function to call with incremental responses/final result.
 * @returns A promise resolving to the interaction ID, or null if sending failed.
 */
async function sendChatMessage(
  payload: AiChatPayload,
  callback: InteractionCallback
): Promise<number | null> {
  log("WsAiClient.ts", `sendChatMessage called with payload: ${JSON.stringify(payload)}`);
  const id = await internalClient.startInteraction('', payload, callback);
  log("WsAiClient.ts", `sendChatMessage received interaction ID: ${id}`);
  return id;
}

/**
 * Stops listening for responses for a specific chat interaction.
 * @param id The interaction ID returned by sendChatMessage.
 * @returns True if the listener was successfully removed, false otherwise.
 */
function cancelChat(id: number): boolean {
  log("WsAiClient.ts", `cancelChat called for ID: ${id}`);
  const result = internalClient.stopInteraction(id);
  log("WsAiClient.ts", `cancelChat ${result ? 'succeeded' : 'failed'} for ID: ${id}`);
  return result;
}

// Expose connection status and potentially connect/disconnect if needed manually
const status: Ref<WebSocketStatus> = internalClient.status;
const connect = internalClient.connect;
const disconnect = internalClient.disconnect;


// Export the simplified interface
export const WsAiClient = {
  sendChatMessage,
  cancelChat,
  status,
  connect,    // Allow manual connection control
  disconnect, // Allow manual disconnection control
};

// Optional: Automatically connect on module load or first call?
// connect(); // Example: Initiate connection immediately 