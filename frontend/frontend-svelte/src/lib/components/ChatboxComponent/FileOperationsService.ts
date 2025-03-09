import { logger } from '$lib/components/LogControlPanel/logger';
import type { Message, ChatSettings } from './types';
import { API_URL } from '$lib/config';

// Interface for chat data to be saved
export interface ChatData {
    filename: string;
    messages: Message[];
    system_prompt: string;
    temperature: number;
}

/**
 * Save the current chat to a file
 * @param filename The name of the file to save (can include path)
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
        
        const response = await fetch(`${API_URL}/files/chat/save`, {
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
 * @param filename The name of the file to load (can include path)
 * @returns Promise with the loaded chat data
 */
export async function loadChat(filename: string): Promise<any> {
    try {
        logger('INFO', 'ui', 'FileOperationsService', `Loading chat from ${filename}`);
        
        // The backend expects a BaseFileRequest model with a filename field
        const response = await fetch(`${API_URL}/files/chat/load`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filename
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
            logger('ERROR', 'ui', 'FileOperationsService', `Server error: ${JSON.stringify(errorData)}`);
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
 * @param path Optional directory path to list files from
 * @returns Promise with the list of chat files
 */
export async function listChats(path: string = ''): Promise<string[]> {
    try {
        logger('INFO', 'ui', 'FileOperationsService', `Listing chat files in path: ${path || 'root'}`);
        
        const response = await fetch(`${API_URL}/files/chat/list`);
        
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
 * @param filename The name of the file to delete (can include path)
 * @returns Promise with the result of the operation
 */
export async function deleteChat(filename: string): Promise<any> {
    try {
        logger('INFO', 'ui', 'FileOperationsService', `Deleting chat ${filename}`);
        
        const response = await fetch(`${API_URL}/files/chat/delete/${encodeURIComponent(filename)}`, {
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

/**
 * Get directory contents
 * @param path Directory path to list
 * @returns Promise with directory contents
 */
export async function getDirectoryContents(path: string = ''): Promise<{files: string[], directories: string[]}> {
    try {
        logger('INFO', 'ui', 'FileOperationsService', `Getting directory contents for: ${path || 'root'}`);
        
        const encodedPath = path ? encodeURIComponent(path) : '';
        const response = await fetch(`${API_URL}/directory/list/${encodedPath}?file_type=chat`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to get directory contents');
        }
        
        const data = await response.json();
        
        // Extract files and directories from the items array
        const files: string[] = [];
        const directories: string[] = [];
        
        // The API returns 'items' array with objects that have 'name', 'type', and 'path' properties
        if (data.items && Array.isArray(data.items)) {
            data.items.forEach((item: any) => {
                if (item.type === 'file') {
                    files.push(item.path);
                } else if (item.type === 'directory') {
                    directories.push(item.name);
                }
            });
        }
        
        return { files, directories };
    } catch (error) {
        logger('ERROR', 'ui', 'FileOperationsService', `Error getting directory contents: ${error}`);
        throw error;
    }
}

/**
 * Create a new directory
 * @param path Path of the directory to create
 * @returns Promise with the result of the operation
 */
export async function createDirectory(path: string): Promise<any> {
    try {
        logger('INFO', 'ui', 'FileOperationsService', `Creating directory: ${path}`);
        
        const response = await fetch(`${API_URL}/directory/create?path=${encodeURIComponent(path)}&file_type=chat`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to create directory');
        }
        
        return await response.json();
    } catch (error) {
        logger('ERROR', 'ui', 'FileOperationsService', `Error creating directory: ${error}`);
        throw error;
    }
} 