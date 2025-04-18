import { reactive } from 'vue';

export enum WebSocketStatus {
    Connecting,
    Connected,
    Disconnected,
    Error,
}

let websocket: WebSocket | null = null;
let wsStatus: WebSocketStatus = WebSocketStatus.Disconnected;

// Reactive state for received messages
export const wsMessages = reactive<any[]>([]);

// Function to get the current status
export function getWebSocketStatus(): WebSocketStatus {
    return wsStatus;
}

// Function to connect to the WebSocket server
export function connectWebSocket(url: string = "ws://127.0.0.1:8000/frontend/ws"):
Promise<void> {
    return new Promise((resolve, reject) => {
        if (websocket && websocket.readyState === WebSocket.OPEN) {
            console.log("WebSocket already connected.");
            resolve();
            return;
        }

        wsStatus = WebSocketStatus.Connecting;
        console.log("Connecting to WebSocket...");

        websocket = new WebSocket(url);

        websocket.onopen = () => {
            wsStatus = WebSocketStatus.Connected;
            console.log("WebSocket Connected");
            resolve(); // Resolve the promise when connected
        };

        websocket.onmessage = (event: MessageEvent) => {
            try {
                const receivedData = JSON.parse(event.data);
                console.log("WebSocket JSON received:", receivedData);
                // Add the received message to the reactive array
                wsMessages.push(receivedData);
                // Optionally, you can limit the size of the message array
                // if (wsMessages.length > 100) { wsMessages.shift(); }
            } catch (error) {
                console.error("Failed to parse WebSocket message:", error, "\nRaw data:", event.data);
            }
        };

        websocket.onclose = (event: CloseEvent) => {
            if (event.wasClean) {
                console.log(`WebSocket Closed cleanly, code=${event.code} reason=${event.reason}`);
                wsStatus = WebSocketStatus.Disconnected;
            } else {
                // e.g. server process killed or network down
                // event.code is usually 1006 in this case
                console.error('WebSocket connection died');
                wsStatus = WebSocketStatus.Error;
            }
            websocket = null; // Clear the instance on close
            // Optionally: Implement reconnection logic here
        };

        websocket.onerror = (error: Event) => {
            console.error("WebSocket Error:", error);
            wsStatus = WebSocketStatus.Error;
            reject(error); // Reject the promise on error
        };
    });
}

// Function to send a JSON message (echo)
export function sendWebSocketJsonMessage(message: Record<string, any>): void {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        try {
            const jsonString = JSON.stringify(message);
            websocket.send(jsonString);
            console.log("WebSocket JSON message sent:", message);
        } catch (error) {
            console.error("Failed to stringify message:", error, "\nOriginal message:", message);
        }
    } else {
        console.error("WebSocket is not connected. Cannot send message.");
        // Optionally: Buffer the message or try to reconnect
    }
}

// Optional: Function to explicitly disconnect
export function disconnectWebSocket(): void {
    if (websocket) {
        websocket.close();
        // onclose handler will update status and log
    }
} 