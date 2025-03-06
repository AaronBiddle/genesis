import { writable, get } from 'svelte/store';
import type { Message, ChatSettings } from './types';

// Default settings values
const DEFAULT_SETTINGS: ChatSettings = {
    temperature: 0.7,
    systemPrompt: "You are a helpful AI assistant.",
    modelId: "deepseek-chat" // Default model
};

// Store factory to create independent stores for each chat instance
export function createChatStore(id: string) {
    // Create stores for messages and settings
    const messages = writable<Message[]>([]);
    const currentResponseId = writable<number | null>(null);
    const newMessage = writable<string>('');
    const settings = writable<ChatSettings>({...DEFAULT_SETTINGS});
    const settingsApplied = writable<boolean>(false);
    const showSettings = writable<boolean>(false);
    const wsConnected = writable<boolean>(false);

    // Helper functions for message management
    function addUserMessage(text: string): void {
        messages.update(msgs => [
            ...msgs, 
            {
                id: msgs.length + 1,
                text: text.trim(),
                sender: 'user',
                timestamp: new Date()
            }
        ]);
    }

    function addSystemMessage(text: string, renderMarkdown: boolean = true): void {
        messages.update(msgs => [
            ...msgs, 
            {
                id: msgs.length + 1,
                text,
                sender: 'system',
                timestamp: new Date(),
                renderMarkdown
            }
        ]);
    }

    function updateSystemMessage(id: number, text: string): void {
        messages.update(msgs => 
            msgs.map(msg => {
                if (msg.id === id) {
                    return { ...msg, text };
                }
                return msg;
            })
        );
    }

    function toggleMarkdownRendering(id: number): void {
        messages.update(msgs => 
            msgs.map(msg => {
                if (msg.id === id) {
                    return { ...msg, renderMarkdown: msg.renderMarkdown === false ? true : false };
                }
                return msg;
            })
        );
    }

    function applySettings(): void {
        settingsApplied.set(true);
        setTimeout(() => {
            settingsApplied.set(false);
        }, 2000);
    }

    function resetSettings(): void {
        settings.set({...DEFAULT_SETTINGS});
        applySettings();
    }

    function toggleSettingsView(): void {
        showSettings.update(value => !value);
    }

    function clearMessages(): void {
        messages.set([]);
    }

    return {
        // Stores
        messages,
        currentResponseId,
        newMessage,
        settings,
        settingsApplied,
        showSettings,
        wsConnected,
        
        // Functions
        addUserMessage,
        addSystemMessage,
        updateSystemMessage,
        toggleMarkdownRendering,
        applySettings,
        resetSettings,
        toggleSettingsView,
        clearMessages
    };
}

// Store registry to keep track of all chat stores
const chatStores: Record<string, ReturnType<typeof createChatStore>> = {};

// Get or create a chat store for a specific ID
export function getChatStore(id: string) {
    if (!chatStores[id]) {
        chatStores[id] = createChatStore(id);
    }
    return chatStores[id];
} 