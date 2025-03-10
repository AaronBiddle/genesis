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

// Export project adapter
export {
    PROJECT_FILE_TYPE,
    projectFileConfig,
    saveProject,
    loadProject,
    deleteProject,
    createNewProject,
    type ProjectData
} from './ProjectAdapter'; 