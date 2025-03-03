import { WS_URL } from '$lib/config.js';
import { get } from 'svelte/store';
import type { WebSocketMessage, WebSocketPayload } from './types';
import { getChatStore } from './ChatStore';
import { writable } from 'svelte/store';

// Single WebSocket connection for all chat instances
let webSocket: WebSocket | null = null;
let isConnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000; // 2 seconds

// Track active sessions
const activeSessions = new Set<string>();

// Global connection status
export const connectionStatus = writable<boolean>(false);

// Initialize the WebSocket connection
function initWebSocket() {
    if (webSocket && (webSocket.readyState === WebSocket.OPEN || webSocket.readyState === WebSocket.CONNECTING)) {
        return; // Already connected or connecting
    }
    
    if (isConnecting) {
        return; // Already attempting to connect
    }
    
    isConnecting = true;
    
    console.log('Initializing WebSocket connection');
    webSocket = new WebSocket(`${WS_URL}/ws/chat`);
    
    webSocket.onopen = () => {
        console.log('WebSocket connected');
        connectionStatus.set(true);
        isConnecting = false;
        reconnectAttempts = 0;
        
        // Update connection status for all active sessions
        activeSessions.forEach(sessionId => {
            const store = getChatStore(sessionId);
            store.wsConnected.set(true);
        });
    };
    
    webSocket.onclose = (event) => {
        console.log(`WebSocket closed: ${event.code} - ${event.reason}`);
        connectionStatus.set(false);
        isConnecting = false;
        
        // Update connection status for all active sessions
        activeSessions.forEach(sessionId => {
            const store = getChatStore(sessionId);
            store.wsConnected.set(false);
        });
        
        // Attempt to reconnect
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
            setTimeout(initWebSocket, RECONNECT_DELAY);
        } else {
            console.error('Max reconnection attempts reached');
        }
    };
    
    webSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        connectionStatus.set(false);
    };
    
    webSocket.onmessage = (event) => {
        try {
            const data: WebSocketMessage = JSON.parse(event.data);
            
            // Route message to the appropriate session handler
            if (data.sessionId) {
                handleWebSocketMessage(data.sessionId, data);
            } else {
                console.error('Received message without sessionId:', data);
            }
        } catch (e) {
            console.error('Error parsing websocket message:', e);
        }
    };
}

// Register a session with the WebSocket service
export function registerSession(sessionId: string): void {
    console.log(`Registering session: ${sessionId}`);
    activeSessions.add(sessionId);
    
    // Initialize WebSocket if not already connected
    initWebSocket();
    
    // Update connection status for this session
    const store = getChatStore(sessionId);
    if (webSocket && webSocket.readyState === WebSocket.OPEN) {
        store.wsConnected.set(true);
    } else {
        store.wsConnected.set(false);
    }
}

// Unregister a session when it's no longer needed
export function unregisterSession(sessionId: string): void {
    console.log(`Unregistering session: ${sessionId}`);
    activeSessions.delete(sessionId);
    
    // If no more active sessions, close the WebSocket
    if (activeSessions.size === 0 && webSocket) {
        console.log('No active sessions, closing WebSocket');
        webSocket.close(1000, 'No active sessions');
        webSocket = null;
    }
}

// Handle incoming WebSocket messages
function handleWebSocketMessage(sessionId: string, data: WebSocketMessage): void {
    const store = getChatStore(sessionId);
    
    // Handle error messages
    if (data.error) {
        const errorText = `Error: ${data.error}${data.details ? ' - ' + data.details : ''}`;
        store.addSystemMessage(errorText, true);
        store.currentResponseId.set(null);
        return;
    }
    
    // Handle streaming tokens
    if (data.token !== undefined) {
        const currentId = get(store.currentResponseId);
        
        if (currentId === null) {
            // Create a new system message for the response
            const newId = get(store.messages).length + 1;
            store.addSystemMessage(data.token, true);
            store.currentResponseId.set(newId);
        } else {
            // Append token to the last system message
            const currentMessages = get(store.messages);
            const lastMessage = currentMessages.find(msg => msg.id === currentId);
            
            if (lastMessage) {
                store.updateSystemMessage(currentId, lastMessage.text + data.token);
            }
        }
    }
    
    // If done flag is received, reset current response
    if (data.done) {
        console.log(`Received final packet (done=true) for session ${sessionId}`);
        store.currentResponseId.set(null);
    }
}

// Send a message via the WebSocket
export function sendMessage(sessionId: string, messageText: string): void {
    if (!messageText.trim()) return;
    
    const store = getChatStore(sessionId);
    
    // Ensure WebSocket is connected
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
        console.error(`WebSocket is not connected for session ${sessionId}`);
        store.addSystemMessage('Error: Not connected to server', true);
        
        // Try to reconnect
        initWebSocket();
        return;
    }
    
    const currentMessages = get(store.messages);
    const currentSettings = get(store.settings);
    
    // Prepare payload with sessionId
    const payload: WebSocketPayload = {
        sessionId: sessionId,
        type: 'message',
        payload: {
            prompt: messageText.trim(),
            history: currentMessages.map(msg => ({ 
                role: msg.sender, 
                content: msg.text 
            })),
            system_prompt: currentSettings.systemPrompt,
            temperature: currentSettings.temperature
        }
    };
    
    // Send payload
    console.log(`Sending message for session ${sessionId}`);
    webSocket.send(JSON.stringify(payload));
    store.currentResponseId.set(null); // will be set on receiving first token
}

// Close all connections when the page unloads
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        if (webSocket) {
            webSocket.close(1000, 'Page unloaded');
        }
    });
} 