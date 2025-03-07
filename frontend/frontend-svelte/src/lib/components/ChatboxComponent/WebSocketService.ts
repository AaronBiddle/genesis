import { WS_URL } from '$lib/config.js';
import { get } from 'svelte/store';
import type { WebSocketMessage, WebSocketPayload } from './types';
import { getChatStore } from './ChatStore';
import { writable } from 'svelte/store';
import { logger } from '$lib/components/LogControlPanel/logger';

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
    
    logger('DEBUG', 'network', 'WebSocketService', 'Initializing WebSocket connection');
    webSocket = new WebSocket(`${WS_URL}/ws/chat`);
    
    webSocket.onopen = () => {
        logger('DEBUG', 'network', 'WebSocketService', 'WebSocket connected');
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
        logger('DEBUG', 'network', 'WebSocketService', `WebSocket closed: ${event.code} - ${event.reason}`);
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
            logger('DEBUG', 'network', 'WebSocketService', `Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
            setTimeout(initWebSocket, RECONNECT_DELAY);
        } else {
            logger('ERROR', 'network', 'WebSocketService', 'Max reconnection attempts reached');
        }
    };
    
    webSocket.onerror = (error) => {
        logger('ERROR', 'network', 'WebSocketService', 'WebSocket error:', error);
        connectionStatus.set(false);
    };
    
    webSocket.onmessage = (event) => {
        try {
            const data: WebSocketMessage = JSON.parse(event.data);
            
            // Route message to the appropriate session handler
            if (data.sessionId) {
                handleWebSocketMessage(data.sessionId, data);
            } else {
                logger('ERROR', 'network', 'WebSocketService', 'Received message without sessionId:', data);
            }
        } catch (e) {
            logger('ERROR', 'network', 'WebSocketService', 'Error parsing websocket message:', e);
        }
    };
}

// Register a session with the WebSocket service
export function registerSession(sessionId: string): void {
    logger('DEBUG', 'network', 'WebSocketService', `Registering session: ${sessionId}`);
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
    logger('DEBUG', 'network', 'WebSocketService', `Unregistering session: ${sessionId}`);
    activeSessions.delete(sessionId);
    
    // If no more active sessions, close the WebSocket
    if (activeSessions.size === 0 && webSocket) {
        logger('DEBUG', 'network', 'WebSocketService', 'No active sessions, closing WebSocket');
        webSocket.close(1000, 'No active sessions');
        webSocket = null;
    }
}

// Handle incoming WebSocket messages
function handleWebSocketMessage(sessionId: string, data: WebSocketMessage): void {
    const store = getChatStore(sessionId);
    
    // Handle error messages
    if (data.error) {
        logger('ERROR', 'websocket', 'handleWebSocketMessage', `Received error: ${data.error}`, data.details);
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
export function sendMessage(sessionId: string, messageText: string): void {
    if (!messageText.trim()) return;
    
    const store = getChatStore(sessionId);
    
    // Ensure WebSocket is connected
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
        logger('ERROR', 'websocket', 'sendMessage', 'WebSocket is not connected');
        store.addSystemMessage('Error: Cannot send message, WebSocket is not connected.', true);
        
        // Try to reconnect
        initWebSocket();
        return;
    }
    
    const currentMessages = get(store.messages);
    const currentSettings = get(store.settings);
    
    // Build conversation history for the API - without reasoning data
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
            prompt: messageText,
            history,
            system_prompt: currentSettings.systemPrompt,
            temperature: currentSettings.temperature,
            model_id: currentSettings.modelId,
            include_reasoning: currentSettings.includeReasoning
        }
    };
    
    // Send payload
    logger('INFO', 'websocket', 'sendMessage', `Sent message to WebSocket for session ${sessionId}`);
    logger('TRACE', 'network', 'WebSocketService', `Message payload for session ${sessionId}:`, JSON.stringify(payload));
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