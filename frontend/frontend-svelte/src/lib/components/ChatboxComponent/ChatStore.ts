import { writable, get, derived } from 'svelte/store';
import type { Message, ChatSettings } from './types';
import { saveChat, loadChat, deleteChat } from './FileOperationsService';
import { logger } from '$lib/components/LogControlPanel/logger';

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
    const settings = writable<ChatSettings>({
        ...DEFAULT_SETTINGS // Use the DEFAULT_SETTINGS to ensure consistency
    });
    const settingsApplied = writable<boolean>(false);
    const showSettings = writable<boolean>(false);
    const wsConnected = writable<boolean>(false);
    const isLoading = writable<boolean>(false);
    const currentFilename = writable<string>('');
    
    // Derived store for displaying the filename without path
    const displayFilename = derived(currentFilename, $currentFilename => {
        if (!$currentFilename) return '';
        const parts = $currentFilename.split('/');
        return parts[parts.length - 1];
    });

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

    function addSystemMessage(text: string, renderMarkdown: boolean = true, reasoning?: string): void {
        messages.update(msgs => [
            ...msgs, 
            {
                id: msgs.length + 1,
                text,
                sender: 'assistant',
                timestamp: new Date(),
                renderMarkdown,
                reasoning,
                showReasoning: false
            }
        ]);
    }

    function updateSystemMessage(id: number, text: string, reasoning?: string): void {
        messages.update(msgs => 
            msgs.map(msg => {
                if (msg.id === id) {
                    return { 
                        ...msg, 
                        text,
                        reasoning: reasoning || msg.reasoning 
                    };
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

    function toggleReasoningDisplay(id: number): void {
        messages.update(msgs => 
            msgs.map(msg => {
                if (msg.id === id && msg.reasoning) {
                    return { ...msg, showReasoning: !msg.showReasoning };
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
        currentFilename.set('');
    }

    // File operations functions
    async function saveCurrentChat(filename: string): Promise<void> {
        try {
            isLoading.set(true);
            const currentMessages = get(messages);
            const currentSettings = get(settings);
            
            await saveChat(filename, currentMessages, currentSettings);
            currentFilename.set(filename);
            
            logger('INFO', 'ui', 'ChatStore', `Chat saved to ${filename}`);
        } catch (error) {
            logger('ERROR', 'ui', 'ChatStore', `Failed to save chat: ${error}`);
            throw error;
        } finally {
            isLoading.set(false);
        }
    }

    async function loadChatFromFile(filename: string): Promise<void> {
        try {
            isLoading.set(true);
            const chatData = await loadChat(filename);
            
            // Convert the loaded messages to our Message format
            const loadedMessages: Message[] = chatData.messages.map((msg: any, index: number) => ({
                id: index + 1,
                text: msg.content,
                sender: msg.role === 'user' ? 'user' : 'assistant',
                timestamp: new Date(),
                renderMarkdown: true,
                showReasoning: false
            }));
            
            // Update the stores
            messages.set(loadedMessages);
            settings.update(s => ({
                ...s,
                systemPrompt: chatData.system_prompt,
                temperature: chatData.temperature
            }));
            currentFilename.set(filename);
            
            logger('INFO', 'ui', 'ChatStore', `Chat loaded from ${filename}`);
        } catch (error) {
            logger('ERROR', 'ui', 'ChatStore', `Failed to load chat: ${error}`);
            throw error;
        } finally {
            isLoading.set(false);
        }
    }

    async function deleteChatFile(filename: string): Promise<void> {
        try {
            isLoading.set(true);
            await deleteChat(filename);
            
            // If the deleted file was the current one, clear the current filename
            if (get(currentFilename) === filename) {
                currentFilename.set('');
            }
            
            logger('INFO', 'ui', 'ChatStore', `Chat deleted: ${filename}`);
        } catch (error) {
            logger('ERROR', 'ui', 'ChatStore', `Failed to delete chat: ${error}`);
            throw error;
        } finally {
            isLoading.set(false);
        }
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
        isLoading,
        currentFilename,
        displayFilename,
        
        // Functions
        addUserMessage,
        addSystemMessage,
        updateSystemMessage,
        toggleMarkdownRendering,
        toggleReasoningDisplay,
        applySettings,
        resetSettings,
        toggleSettingsView,
        clearMessages,
        
        // File operations
        saveCurrentChat,
        loadChatFromFile,
        deleteChatFile
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