/**
 * Generic file operations types
 */

export interface FileOperationsConfig {
    /**
     * The type of files being operated on (e.g., 'chat', 'project', etc.)
     * This is used to organize files in the backend
     */
    fileType: string;
    
    /**
     * Optional file extension to use (defaults to .json)
     */
    fileExtension?: string;
    
    /**
     * Optional validation function for filenames
     */
    validateFilename?: (filename: string) => { valid: boolean; message?: string };
    
    /**
     * Optional custom title for the dialog
     */
    dialogTitle?: {
        save?: string;
        load?: string;
        delete?: string;
    };
}

export interface FileData {
    /**
     * The file content as a serializable object
     */
    content: any;
    
    /**
     * Metadata about the file
     */
    metadata?: {
        createdAt?: string;
        updatedAt?: string;
        [key: string]: any;
    };
}

export interface DirectoryContents {
    /**
     * List of files in the directory
     */
    files: string[];
    
    /**
     * List of subdirectories in the directory
     */
    directories: string[];
}

export interface FileOperationResult {
    /**
     * Whether the operation was successful
     */
    success: boolean;
    
    /**
     * Optional error message if the operation failed
     */
    error?: string;
    
    /**
     * Optional data returned from the operation
     */
    data?: any;
}

export type FileOperationMode = 'save' | 'load' | 'delete';

export interface FileOperationEvent {
    /**
     * The full path of the file
     */
    filename: string;
    
    /**
     * The operation mode
     */
    mode: FileOperationMode;
    
    /**
     * The file type
     */
    fileType: string;
} 