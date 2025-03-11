/**
 * File Operations Adapters
 * 
 * This module provides adapters for different file types to use with the
 * generic file operations system.
 */

// Export chat adapter
export {
    CHAT_FILE_TYPE,
    chatFileConfig,
    saveChat,
    loadChat,
    deleteChat
} from './ChatAdapter';

// Export document adapter
export {
    DOCUMENT_FILE_TYPE,
    documentFileConfig,
    saveDocument,
    loadDocument,
    deleteDocument,
    createNewDocument,
    type DocumentData
} from './DocumentAdapter'; 