/**
 * File Operations Component
 * 
 * This module provides a reusable file operations system that can be used
 * by any component that needs to save, load, or delete files.
 */

// Export types
export type {
    FileOperationsConfig,
    FileData,
    DirectoryContents,
    FileOperationResult,
    FileOperationMode,
    FileOperationEvent
} from './types';

// Export components
export { default as FileOperationsDialog } from './FileOperationsDialog.svelte';

// Export services
export {
    saveFile,
    loadFile,
    listFiles,
    deleteFile,
    getDirectoryContents,
    createDirectory,
    deleteDirectory
} from './FileOperationsService';

// Export adapters
export * as adapters from './adapters'; 