import { logger } from '$lib/components/LogControlPanel/logger';
import { API_URL } from '$lib/config';
import type { DirectoryContents, FileData, FileOperationResult } from './types';

const NAMESPACE = 'FileOperations/FileOperationsService';

/**
 * Save data to a file
 * @param fileType The type of file (e.g., 'chat', 'project', etc.)
 * @param filename The name of the file to save (can include path)
 * @param content The content to save
 * @returns Promise with the result of the operation
 */
export async function saveFile(fileType: string, filename: string, content: any): Promise<FileOperationResult> {
    try {
        logger('INFO', 'ui', NAMESPACE, `Saving ${fileType} file to ${filename}`);
        
        const response = await fetch(`${API_URL}/files/${fileType}/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filename,
                file_type: fileType,
                content
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(errorData.detail || `Failed to save ${fileType} file`);
        }
        
        const data = await response.json();
        return {
            success: true,
            data
        };
    } catch (error: any) {
        logger('ERROR', 'ui', NAMESPACE, `Error saving ${fileType} file: ${error}`);
        return {
            success: false,
            error: error.message || `Failed to save ${fileType} file`
        };
    }
}

/**
 * Load data from a file
 * @param fileType The type of file (e.g., 'chat', 'project', etc.)
 * @param filename The name of the file to load (can include path)
 * @returns Promise with the loaded file data
 */
export async function loadFile(fileType: string, filename: string): Promise<FileOperationResult> {
    try {
        logger('INFO', 'ui', NAMESPACE, `Loading ${fileType} file from ${filename}`);
        
        const endpoint = `${API_URL}/files/${fileType}/load`;
        logger('DEBUG', 'ui', NAMESPACE, `Endpoint: ${endpoint}`);
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filename
            })
        });
        
        logger('DEBUG', 'ui', NAMESPACE, `Response status: ${response.status}`);
        
        if (!response.ok) {
            let errorMessage = `Failed to load ${fileType} file`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.detail || errorMessage;
            } catch (e) {
                // If we can't parse the error response, use the default message
            }
            
            logger('ERROR', 'ui', NAMESPACE, `Error loading ${fileType} file: ${errorMessage}`);
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        logger('DEBUG', 'ui', NAMESPACE, `Data loaded successfully`);
        
        return {
            success: true,
            data
        };
    } catch (error: any) {
        const errorMsg = error.message || `Failed to load ${fileType} file`;
        logger('ERROR', 'ui', NAMESPACE, `Error loading ${fileType} file: ${errorMsg}`);
        
        return {
            success: false,
            error: errorMsg
        };
    }
}

/**
 * List all available files of a specific type
 * @param fileType The type of file (e.g., 'chat', 'project', etc.)
 * @param path Optional directory path to list files from
 * @returns Promise with the list of files
 */
export async function listFiles(fileType: string, path: string = ''): Promise<FileOperationResult> {
    try {
        logger('INFO', 'ui', NAMESPACE, `Listing ${fileType} files in path: ${path || 'root'}`);
        
        const encodedPath = path ? encodeURIComponent(path) : '';
        const endpoint = encodedPath 
            ? `${API_URL}/files/${fileType}/list/${encodedPath}`
            : `${API_URL}/files/${fileType}/list`;
            
        const response = await fetch(endpoint);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(errorData.detail || `Failed to list ${fileType} files`);
        }
        
        const data = await response.json();
        return {
            success: true,
            data: data.files
        };
    } catch (error: any) {
        logger('ERROR', 'ui', NAMESPACE, `Error listing ${fileType} files: ${error}`);
        return {
            success: false,
            error: error.message || `Failed to list ${fileType} files`
        };
    }
}

/**
 * Delete a file
 * @param fileType The type of file (e.g., 'chat', 'project', etc.)
 * @param filename The name of the file to delete (can include path)
 * @returns Promise with the result of the operation
 */
export async function deleteFile(fileType: string, filename: string): Promise<FileOperationResult> {
    try {
        logger('INFO', 'ui', NAMESPACE, `Deleting ${fileType} file ${filename}`);
        
        const response = await fetch(`${API_URL}/files/${fileType}/delete/${encodeURIComponent(filename)}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(errorData.detail || `Failed to delete ${fileType} file`);
        }
        
        const data = await response.json();
        return {
            success: true,
            data
        };
    } catch (error: any) {
        logger('ERROR', 'ui', NAMESPACE, `Error deleting ${fileType} file: ${error}`);
        return {
            success: false,
            error: error.message || `Failed to delete ${fileType} file`
        };
    }
}

/**
 * Get directory contents
 * @param fileType The type of file (e.g., 'chat', 'project', etc.)
 * @param path Directory path to list
 * @returns Promise with directory contents
 */
export async function getDirectoryContents(fileType: string, path: string = ''): Promise<FileOperationResult & { data?: DirectoryContents }> {
    try {
        logger('INFO', 'ui', NAMESPACE, `Getting ${fileType} directory contents for: ${path || 'root'}`);
        
        const encodedPath = path ? encodeURIComponent(path) : '';
        const endpoint = encodedPath 
            ? `${API_URL}/directory/${fileType}/list/${encodedPath}`
            : `${API_URL}/directory/${fileType}/list`;
            
        const response = await fetch(endpoint);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
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
        
        return {
            success: true,
            data: { files, directories }
        };
    } catch (error: any) {
        logger('ERROR', 'ui', NAMESPACE, `Error getting ${fileType} directory contents: ${error}`);
        return {
            success: false,
            error: error.message || 'Failed to get directory contents'
        };
    }
}

/**
 * Create a new directory
 * @param fileType The type of file (e.g., 'chat', 'project', etc.)
 * @param path Path of the directory to create
 * @returns Promise with the result of the operation
 */
export async function createDirectory(fileType: string, path: string): Promise<FileOperationResult> {
    try {
        logger('INFO', 'ui', NAMESPACE, `Creating ${fileType} directory: ${path}`);
        
        const response = await fetch(`${API_URL}/directory/${fileType}/create?path=${encodeURIComponent(path)}`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(errorData.detail || 'Failed to create directory');
        }
        
        const data = await response.json();
        return {
            success: true,
            data
        };
    } catch (error: any) {
        logger('ERROR', 'ui', NAMESPACE, `Error creating ${fileType} directory: ${error}`);
        return {
            success: false,
            error: error.message || 'Failed to create directory'
        };
    }
}

/**
 * Delete a directory
 * @param fileType The type of file (e.g., 'chat', 'project', etc.)
 * @param path Path of the directory to delete
 * @returns Promise with the result of the operation
 */
export async function deleteDirectory(fileType: string, path: string): Promise<FileOperationResult> {
    try {
        logger('INFO', 'ui', NAMESPACE, `Deleting ${fileType} directory: ${path}`);
        
        const encodedPath = encodeURIComponent(path);
        const response = await fetch(`${API_URL}/directory/${fileType}/delete/${encodedPath}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(errorData.detail || 'Failed to delete directory');
        }
        
        const data = await response.json();
        return {
            success: true,
            data
        };
    } catch (error: any) {
        logger('ERROR', 'ui', NAMESPACE, `Error deleting ${fileType} directory: ${error}`);
        return {
            success: false,
            error: error.message || 'Failed to delete directory'
        };
    }
} 