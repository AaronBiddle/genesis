/**
 * Chat Adapter for File Operations
 * 
 * This adapter provides specialized functions for working with chat files
 * using the generic file operations system.
 */

import { saveFile, loadFile, deleteFile } from '../FileOperationsService';
import type { FileOperationsConfig } from '../types';
import type { Message, ChatSettings } from '../../ChatboxComponent/types';
import { logger } from '$lib/components/LogControlPanel/logger';

const NAMESPACE = 'FileOperations/adapters/ChatAdapter';

// File type for chat files
export const CHAT_FILE_TYPE = 'chat';

// Configuration for chat files
export const chatFileConfig: FileOperationsConfig = {
    fileType: CHAT_FILE_TYPE,
    fileExtension: '.json',
    dialogTitle: {
        save: 'Save Chat',
        load: 'Load Chat',
        delete: 'Delete Chat'
    }
};

/**
 * Save a chat to a file
 * @param filename The name of the file to save
 * @param messages The chat messages
 * @param settings The chat settings
 * @returns Promise with the result of the operation
 */
export async function saveChat(filename: string, messages: Message[], settings: ChatSettings) {
    try {
        logger('INFO', 'ui', NAMESPACE, `ChatAdapter: Saving chat to ${filename}`);
        
        // Format the data for the API
        const content = {
            messages: messages.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text,
                reasoning: msg.reasoning
            })),
            system_prompt: settings.systemPrompt,
            temperature: settings.temperature
        };
        
        return await saveFile(CHAT_FILE_TYPE, filename, content);
    } catch (error) {
        logger('ERROR', 'ui', NAMESPACE, `ChatAdapter: Error saving chat: ${error}`);
        throw error;
    }
}

/**
 * Load a chat from a file
 * @param filename The name of the file to load
 * @returns Promise with the loaded chat data
 */
export async function loadChat(filename: string) {
    try {
        logger('INFO', 'ui', NAMESPACE, `ChatAdapter: Loading chat from ${filename}`);
        
        const result = await loadFile(CHAT_FILE_TYPE, filename);
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to load chat');
        }
        
        return result.data;
    } catch (error) {
        logger('ERROR', 'ui', NAMESPACE, `ChatAdapter: Error loading chat: ${error}`);
        throw error;
    }
}

/**
 * Delete a chat file
 * @param filename The name of the file to delete
 * @returns Promise with the result of the operation
 */
export async function deleteChat(filename: string) {
    try {
        logger('INFO', 'ui', NAMESPACE, `ChatAdapter: Deleting chat ${filename}`);
        
        return await deleteFile(CHAT_FILE_TYPE, filename);
    } catch (error) {
        logger('ERROR', 'ui', NAMESPACE, `ChatAdapter: Error deleting chat: ${error}`);
        throw error;
    }
} 