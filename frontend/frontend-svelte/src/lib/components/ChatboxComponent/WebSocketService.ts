import { WS_URL } from '$lib/config.js';
import { get } from 'svelte/store';
import type { Message, WebSocketMessage } from './types';
import { getChatStore } from './ChatStore';

// WebSocket connections for each chat instance
const connections: Record<string, WebSocket> = {};

export function connect(chatId: string): void {
    const store = getChatStore(chatId);
    
    // Close existing connection if any
    if (connections[chatId]) {
        connections[chatId].close();
    }

    // Create new WebSocket connection
    const ws = new WebSocket(`${WS_URL}/ws/chat`);
    connections[chatId] = ws;
    
    ws.onopen = () => {
        console.log(`WebSocket connected for chat ${chatId}`);
        store.wsConnected.set(true);
    };

    ws.onclose = () => {
        console.log(`WebSocket closed for chat ${chatId}`);
        store.wsConnected.set(false);
    };

    ws.onerror = (error) => {
        console.error(`WebSocket error for chat ${chatId}:`, error);
        store.wsConnected.set(false);
    };

    ws.onmessage = (event) => {
        try {
            const data: WebSocketMessage = JSON.parse(event.data);
            handleWebSocketMessage(chatId, data);
        } catch (e) {
            console.error(`Error parsing websocket message for chat ${chatId}:`, e);
        }
    };
}

function handleWebSocketMessage(chatId: string, data: WebSocketMessage): void {
    const store = getChatStore(chatId);
    
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
        store.currentResponseId.set(null);
    }
}

export function sendMessage(chatId: string, messageText: string): void {
    if (!messageText.trim()) return;
    
    const store = getChatStore(chatId);
    const ws = connections[chatId];
    
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.error(`WebSocket is not connected for chat ${chatId}`);
        store.addSystemMessage('Error: Not connected to server', true);
        return;
    }

    const currentMessages = get(store.messages);
    const currentSettings = get(store.settings);
    
    // Prepare payload for websocket
    const payload = {
        prompt: messageText.trim(),
        history: currentMessages.map(msg => ({ 
            role: msg.sender, 
            content: msg.text 
        })),
        system_prompt: currentSettings.systemPrompt,
        temperature: currentSettings.temperature
    };
    
    // Send payload
    ws.send(JSON.stringify(payload));
    store.currentResponseId.set(null); // will be set on receiving first token
} 