/**
 * Document Adapter for File Operations
 * 
 * This adapter provides specialized functions for working with markdown document files
 * using the generic file operations system.
 */

import { saveFile, loadFile, deleteFile } from '../FileOperationsService';
import type { FileOperationsConfig } from '../types';
import { logger } from '$lib/components/LogControlPanel/logger';

const NAMESPACE = 'FileOperations/adapters/DocumentAdapter';

// File type for document files
export const DOCUMENT_FILE_TYPE = 'document';

// Document data interface
export interface DocumentData {
    content: string;
    metadata?: {
        title?: string;
        created?: string;
        modified?: string;
        tags?: string[];
        [key: string]: any;
    };
}

// Configuration for document files
export const documentFileConfig: FileOperationsConfig = {
    fileType: DOCUMENT_FILE_TYPE,
    fileExtension: '.md',
    dialogTitle: {
        save: 'Save Document',
        load: 'Open Document',
        delete: 'Delete Document'
    },
    validateFilename: (name) => {
        // Only allow alphanumeric characters, hyphens, underscores, and spaces
        const valid = /^[a-zA-Z0-9_\- ]+$/.test(name);
        return {
            valid,
            message: valid ? '' : 'Document name can only contain letters, numbers, spaces, underscores, and hyphens'
        };
    }
};

/**
 * Save a document to a file
 * @param filename The name of the file to save
 * @param content The document content (markdown text)
 * @param metadata Optional metadata for the document
 * @returns Promise with the result of the operation
 */
export async function saveDocument(filename: string, content: string, metadata: DocumentData['metadata'] = {}) {
    try {
        // Store metadata locally if needed for the frontend
        const documentData: DocumentData = {
            content,
            metadata: {
                ...metadata,
                modified: new Date().toISOString()
            }
        };
        
        // If this is a new document, add created timestamp
        if (documentData.metadata && !metadata.created) {
            documentData.metadata.created = documentData.metadata.modified;
        }
        
        logger('INFO', 'ui', NAMESPACE, `Saving document to ${filename}`);
        
        // Send only the content string to the backend as it expects
        return await saveFile(DOCUMENT_FILE_TYPE, filename, content);
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger('ERROR', 'ui', NAMESPACE, `Error saving document: ${errorMsg}`);
        throw error;
    }
}

/**
 * Load a document from a file
 * @param filename The name of the file to load
 * @returns Promise with the loaded document data
 */
export async function loadDocument(filename: string): Promise<DocumentData> {
    try {
        logger('INFO', 'ui', NAMESPACE, `Loading document from ${filename}`);
        
        const result = await loadFile(DOCUMENT_FILE_TYPE, filename);
        
        if (!result.success) {
            const errorMsg = result.error || 'Failed to load document';
            logger('ERROR', 'ui', NAMESPACE, `Load failed: ${errorMsg}`);
            throw new Error(errorMsg);
        }
        
        // The backend returns { filename, content } for documents
        // Convert this to our DocumentData format
        const documentData: DocumentData = {
            // If the backend returns content directly, use it, otherwise create an empty document
            content: typeof result.data.content === 'string' ? result.data.content : '',
            metadata: {
                title: filename,
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                tags: []
            }
        };
        
        logger('INFO', 'ui', NAMESPACE, `Document loaded successfully: ${filename}`);
        return documentData;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger('ERROR', 'ui', NAMESPACE, `Error loading document: ${errorMsg}`);
        logger('ERROR', 'ui', NAMESPACE, `Error details: ${JSON.stringify(error)}`);
        throw error;
    }
}

/**
 * Delete a document file
 * @param filename The name of the file to delete
 * @returns Promise with the result of the operation
 */
export async function deleteDocument(filename: string) {
    try {
        logger('INFO', 'ui', NAMESPACE, `Deleting document ${filename}`);
        
        return await deleteFile(DOCUMENT_FILE_TYPE, filename);
    } catch (error) {
        logger('ERROR', 'ui', NAMESPACE, `Error deleting document: ${error}`);
        throw error;
    }
}

/**
 * Create a new empty document
 * @param title Optional title for the document
 * @returns A new document data object
 */
export function createNewDocument(title: string = ''): DocumentData {
    return {
        content: '',
        metadata: {
            title,
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            tags: []
        }
    };
} 