import { logger } from '$lib/components/LogControlPanel/logger';
import type { Message, ChatSettings } from './types';

// Interface for chat data to be saved
export interface ChatData {
    filename: string;
    messages: Message[];
    system_prompt: string;
    temperature: number;
}

// Base URL for API requests
const API_BASE_URL = '/api';

/**
 * Save the current chat to a file
 * @param filename The name of the file to save
 * @param messages The chat messages
 * @param settings The chat settings
 * @returns Promise with the result of the operation
 */
export async function saveChat(filename: string, messages: Message[], settings: ChatSettings): Promise<any> {
    try {
        logger('INFO', 'ui', 'FileOperationsService', `Saving chat to ${filename}`);
        
        // Format the data for the API
        const content = {
            messages: messages.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text
            })),
            system_prompt: settings.systemPrompt,
            temperature: settings.temperature
        };
        
        const response = await fetch(`${API_BASE_URL}/files/chat/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filename,
                file_type: 'chat',
                content
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to save chat');
        }
        
        return await response.json();
    } catch (error) {
        logger('ERROR', 'ui', 'FileOperationsService', `Error saving chat: ${error}`);
        throw error;
    }
}

/**
 * Load a chat from a file
 * @param filename The name of the file to load
 * @returns Promise with the loaded chat data
 */
export async function loadChat(filename: string): Promise<any> {
    try {
        logger('INFO', 'ui', 'FileOperationsService', `Loading chat from ${filename}`);
        
        const response = await fetch(`${API_BASE_URL}/files/chat/load`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filename
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to load chat');
        }
        
        return await response.json();
    } catch (error) {
        logger('ERROR', 'ui', 'FileOperationsService', `Error loading chat: ${error}`);
        throw error;
    }
}

/**
 * List all available chat files
 * @returns Promise with the list of chat files
 */
export async function listChats(): Promise<string[]> {
    try {
        logger('INFO', 'ui', 'FileOperationsService', 'Listing chat files');
        
        const response = await fetch(`${API_BASE_URL}/files/chat/list`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to list chats');
        }
        
        const data = await response.json();
        return data.files;
    } catch (error) {
        logger('ERROR', 'ui', 'FileOperationsService', `Error listing chats: ${error}`);
        throw error;
    }
}

/**
 * Delete a chat file
 * @param filename The name of the file to delete
 * @returns Promise with the result of the operation
 */
export async function deleteChat(filename: string): Promise<any> {
    try {
        logger('INFO', 'ui', 'FileOperationsService', `Deleting chat ${filename}`);
        
        const response = await fetch(`${API_BASE_URL}/files/chat/delete/${encodeURIComponent(filename)}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to delete chat');
        }
        
        return await response.json();
    } catch (error) {
        logger('ERROR', 'ui', 'FileOperationsService', `Error deleting chat: ${error}`);
        throw error;
    }
} 