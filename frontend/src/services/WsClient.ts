import { ref } from 'vue';

// Define the structure for messages passed to callbacks
export interface InteractionMessage {
    data?: any;
    error?: any;
    // Consider adding isComplete?: boolean if the backend will signal stream end
}

// Define the callback function signature
export type InteractionCallback = (message: InteractionMessage) => void;

export enum WebSocketStatus {
    Connecting,
    Connected,
    Disconnected,
    Error,
}

let websocket: WebSocket | null = null;
// Make status reactive for UI updates
export const wsStatus = ref<WebSocketStatus>(WebSocketStatus.Disconnected);

// Map to store ongoing interactions: interactionId -> callback
let interactionsMap = new Map<number, InteractionCallback>();
let nextInteractionId = 0;

// Function to connect to the WebSocket server
export function connectWebSocket(url: string = "ws://127.0.0.1:8000/frontend/ws/"):
Promise<void> {
    // Prevent multiple connection attempts
    if (websocket || wsStatus.value === WebSocketStatus.Connecting) {
        if (websocket?.readyState === WebSocket.OPEN) {
            console.log("WebSocket already connected.");
            return Promise.resolve();
        }
        if (wsStatus.value === WebSocketStatus.Connecting) {
            console.log("WebSocket connection attempt already in progress.");
            // Potentially return a promise that resolves when the current attempt finishes
            // For simplicity now, just return a resolved promise
            return Promise.resolve(); 
        }
    }

    // Reset state in case of reconnection
    interactionsMap.clear();
    nextInteractionId = 0;

    return new Promise((resolve, reject) => {

        wsStatus.value = WebSocketStatus.Connecting;
        console.log("Connecting to WebSocket...");

        websocket = new WebSocket(url);

        websocket.onopen = () => {
            wsStatus.value = WebSocketStatus.Connected;
            console.log("WebSocket Connected");
            resolve();
        };

        websocket.onmessage = (event: MessageEvent) => {
            try {
                const receivedMessage = JSON.parse(event.data);
                console.debug("WebSocket raw message received:", receivedMessage);

                // Check if it's a response to a specific interaction
                if (typeof receivedMessage.responseId === 'number') {
                    const callback = interactionsMap.get(receivedMessage.responseId);
                    if (callback) {
                        // Extract relevant parts for the callback
                        const callbackMessage: InteractionMessage = {
                            data: receivedMessage.data,
                            error: receivedMessage.error,
                            // Potentially add isComplete handling here
                        };
                        try {
                            callback(callbackMessage);
                        } catch (callbackError) {
                            console.error(`Error in interaction callback for ID ${receivedMessage.responseId}:`, callbackError);
                            // Optionally, notify the specific interaction of the callback error?
                        }
                    } else {
                        // Received a response for an unknown/stopped interaction
                        console.warn(`Received message for unknown or stopped interaction ID: ${receivedMessage.responseId}`);
                    }
                } else {
                    // Handle messages not tied to a specific request (e.g., broadcasts)
                    // This part needs specific application logic if required.
                    console.log("WebSocket message received (not tied to a specific request):", receivedMessage);
                }

            } catch (error) {
                console.error("Failed to parse WebSocket message or process callback:", error, "\nRaw data:", event.data);
            }
        };

        websocket.onclose = (event: CloseEvent) => {
            websocket = null; // Clear the instance
            interactionsMap.clear(); // Clear interactions on close
            nextInteractionId = 0;

            if (event.wasClean) {
                console.log(`WebSocket Closed cleanly, code=${event.code} reason=${event.reason}`);
                wsStatus.value = WebSocketStatus.Disconnected;
            } else {
                console.error('WebSocket connection died unexpectedly');
                wsStatus.value = WebSocketStatus.Error;
            }
        };

        websocket.onerror = (error: Event) => {
            console.error("WebSocket Error:", error);
            // wsStatus is often set by onclose shortly after onerror
            if (wsStatus.value !== WebSocketStatus.Disconnected) {
                wsStatus.value = WebSocketStatus.Error;
            }
            // Ensure cleanup even if onclose isn't called immediately
            if (websocket) {
                 websocket = null;
            }
            interactionsMap.clear();
            nextInteractionId = 0;
            reject(error);
        };
    });
}

// --- New Interaction Functions ---

/**
 * Starts an interaction over the WebSocket.
 * Sends an initial message and registers a callback for subsequent messages.
 * @param route The target route/endpoint on the backend.
 * @param initialPayload The initial data payload to send.
 * @param callback The function to call for every message received for this interaction.
 * @returns The interaction ID (number) if successful, or null if not connected.
 */
export function startInteraction(
    route: string,
    initialPayload: any,
    callback: InteractionCallback
): number | null {
    if (!websocket || websocket.readyState !== WebSocket.OPEN) {
        console.error("WebSocket is not connected. Cannot start interaction.");
        return null;
    }

    const interactionId = nextInteractionId++;
    interactionsMap.set(interactionId, callback);

    const messageToSend = {
        requestId: interactionId,
        route: route,
        payload: initialPayload,
    };

    try {
        const jsonString = JSON.stringify(messageToSend);
        websocket.send(jsonString);
        console.debug(`WebSocket interaction ${interactionId} started:`, messageToSend);
        return interactionId;
    } catch (error) {
        console.error("Failed to stringify or send interaction message:", error, "\nOriginal message:", messageToSend);
        // Clean up the map entry if sending failed
        interactionsMap.delete(interactionId);
        // Roll back ID? Not strictly necessary if we just skip this ID.
        return null;
    }
}

/**
 * Stops listening for messages for a specific interaction.
 * Removes the callback associated with the interaction ID.
 * @param interactionId The ID of the interaction to stop.
 */
export function stopInteraction(interactionId: number): boolean {
    const deleted = interactionsMap.delete(interactionId);
    if (deleted) {
        console.debug(`Stopped listening for interaction ID: ${interactionId}`);
    } else {
        console.warn(`Attempted to stop non-existent interaction ID: ${interactionId}`);
    }
    return deleted;
}


// --- Existing Control Functions ---

// Optional: Function to explicitly disconnect the single WebSocket
export function disconnectWebSocket(): void {
    if (websocket) {
        console.log("Disconnecting WebSocket explicitly.");
        // Setting the status might be premature here, onclose should handle it
        // wsStatus.value = WebSocketStatus.Disconnected;
        websocket.close();
        // onclose handler will update status, clear map, and reset ID
    }
} 