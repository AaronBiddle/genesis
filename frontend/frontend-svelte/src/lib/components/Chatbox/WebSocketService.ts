import { WS_URL } from '$lib/config.js';
import { get } from 'svelte/store';
import type { WebSocketMessage, WebSocketPayload } from './types';
import { getChatStore } from './ChatStore';
import { writable } from 'svelte/store';
import { logger } from '$lib/components/LogControlPanel/logger';

// Define namespace as a constant using path-like format
const NAMESPACE = 'Chatbox/WebSocketService';

// Single WebSocket connection for all chat instances
let webSocket: WebSocket | null = null;
let isConnecting = false;

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
    
    logger('DEBUG', 'network', NAMESPACE, 'Initializing WebSocket connection');
    webSocket = new WebSocket(`${WS_URL}/ws/chat`);
    
    webSocket.onopen = () => {
        logger('DEBUG', 'network', NAMESPACE, 'WebSocket connected');
        connectionStatus.set(true);
        isConnecting = false;
        
        // Update connection status for all active sessions
        activeSessions.forEach(sessionId => {
            const store = getChatStore(sessionId);
            store.wsConnected.set(true);
        });
    };
    
    webSocket.onclose = (event) => {
        logger('DEBUG', 'network', NAMESPACE, `WebSocket closed: ${event.code} - ${event.reason}`);
        connectionStatus.set(false);
        isConnecting = false;
        
        // Update connection status for all active sessions
        activeSessions.forEach(sessionId => {
            const store = getChatStore(sessionId);
            store.wsConnected.set(false);
        });
        
        logger('INFO', 'network', NAMESPACE, 'WebSocket connection closed. No automatic reconnection will be attempted.');
    };
    
    webSocket.onerror = (error) => {
        logger('ERROR', 'network', NAMESPACE, 'WebSocket error:', error);
        connectionStatus.set(false);
    };
    
    webSocket.onmessage = (event) => {
        try {
            const data: WebSocketMessage = JSON.parse(event.data);
            
            // Route message to the appropriate session handler
            if (data.sessionId) {
                handleWebSocketMessage(data.sessionId, data);
            } else {
                logger('ERROR', 'network', NAMESPACE, 'Received message without sessionId:', data);
            }
        } catch (e) {
            logger('ERROR', 'network', NAMESPACE, 'Error parsing websocket message:', e);
        }
    };
}

// Function to attempt reconnection
export function reconnectWebSocket(): void {
    logger('INFO', 'network', NAMESPACE, 'Attempting to reconnect WebSocket');
    
    // Close existing socket if it exists
    if (webSocket) {
        webSocket.close(1000, 'Manual reconnection');
        webSocket = null;
    }
    
    // Reset connecting flag to allow new connection
    isConnecting = false;
    
    // Initialize a new connection
    initWebSocket();
    
    // Update connection status for all sessions
    activeSessions.forEach(sessionId => {
        const store = getChatStore(sessionId);
        if (webSocket && webSocket.readyState === WebSocket.OPEN) {
            store.wsConnected.set(true);
        } else {
            store.wsConnected.set(false);
        }
    });
}

// Register a session with the WebSocket service
export function registerSession(panelId: string): void {
    const sessionId = panelId; // Explicit mapping between panel ID and session ID
    logger('DEBUG', 'network', NAMESPACE, `Registering session: ${sessionId}`);
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
export function unregisterSession(panelId: string): void {
    const sessionId = panelId; // Explicit mapping between panel ID and session ID
    logger('DEBUG', 'network', NAMESPACE, `Unregistering session: ${sessionId}`);
    activeSessions.delete(sessionId);
    
    // If no more active sessions, close the WebSocket
    if (activeSessions.size === 0 && webSocket) {
        logger('DEBUG', 'network', NAMESPACE, 'No active sessions, closing WebSocket');
        webSocket = null;
    }
}

// Handle incoming WebSocket messages
function handleWebSocketMessage(sessionId: string, data: WebSocketMessage): void {
    const store = getChatStore(sessionId);
    
    // Handle error messages
    if (data.error) {
        logger('ERROR', 'network', NAMESPACE, `Received error: ${data.error}`, data.details);
        store.addSystemMessage(`Error: ${data.error}${data.details ? ` - ${data.details}` : ''}`, true);
        store.currentResponseId.set(null);
        return;
    }
    
    // Handle streaming tokens
    if (data.token !== undefined || data.reasoning !== undefined) {
        const currentId = get(store.currentResponseId);
        
        if (currentId === null) {
            // Create a new system message for the response
            const newId = get(store.messages).length + 1;
            store.addSystemMessage(data.token || '', true, data.reasoning);
            store.currentResponseId.set(newId);
        } else {
            // Append token to the last system message
            const currentMessages = get(store.messages);
            const lastMessage = currentMessages.find(msg => msg.id === currentId);
            
            if (lastMessage) {
                if (data.token !== undefined) {
                    // If this is a token update, append to the message text
                    store.updateSystemMessage(
                        currentId, 
                        lastMessage.text + data.token, 
                        data.reasoning !== undefined 
                            ? (lastMessage.reasoning || '') + data.reasoning 
                            : lastMessage.reasoning
                    );
                } else if (data.reasoning !== undefined) {
                    // If this is just a reasoning update, only update the reasoning
                    store.updateSystemMessage(
                        currentId, 
                        lastMessage.text, 
                        (lastMessage.reasoning || '') + data.reasoning
                    );
                }
            }
        }
    }
    
    // Handle completion message
    if (data.done) {
        store.currentResponseId.set(null);
    }
}

// Send a message via the WebSocket
export function sendMessage(panelId: string, messageText: string): void {
    const sessionId = panelId; // Explicit mapping between panel ID and session ID
    
    if (!messageText.trim()) return;
    
    const store = getChatStore(sessionId);
    
    // Ensure WebSocket is connected
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
        logger('ERROR', 'network', NAMESPACE, 'WebSocket is not connected');
        store.addSystemMessage('Error: Cannot send message, WebSocket is not connected.', true);
        
        // Removing auto reconnect attempt
        return;
    }
    
    const currentMessages = get(store.messages);
    const currentSettings = get(store.settings);
    
    // Add the user message to the store
    store.addUserMessage(messageText);
    
    // Build conversation history for the API - without reasoning data
    // Use only the previous messages (before adding the current one)
    const history = currentMessages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
        // Reasoning data removed as it's not used by the backend
    }));
    
    // Build the payload with the includeReasoning flag
    const payload: WebSocketPayload = {
        sessionId,
        type: 'message',
        payload: {
            prompt: messageText, // Keep the prompt field with the current message
            history, // History contains only previous messages
            system_prompt: currentSettings.systemPrompt,
            temperature: currentSettings.temperature,
            model_id: currentSettings.modelId
            // Removed include_reasoning flag - backend will always send reasoning if available
        }
    };
    
    // Send payload
    logger('INFO', 'network', NAMESPACE, `Sent message to WebSocket for session ${sessionId}`);
    logger('TRACE', 'network', NAMESPACE, `Message payload for session ${sessionId}:`, JSON.stringify(payload));
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