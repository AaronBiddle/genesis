/**
 * Project Adapter for File Operations
 * 
 * This adapter provides specialized functions for working with project files
 * using the generic file operations system.
 */

import { saveFile, loadFile, deleteFile } from '../FileOperationsService';
import type { FileOperationsConfig } from '../types';
import { logger } from '$lib/components/LogControlPanel/logger';

// File type for project files
export const PROJECT_FILE_TYPE = 'project';

// Project data interface
export interface ProjectData {
    name: string;
    description: string;
    created: string;
    modified: string;
    settings: {
        theme: string;
        layout: string;
        [key: string]: any;
    };
    components: {
        id: string;
        type: string;
        config: any;
    }[];
}

// Configuration for project files
export const projectFileConfig: FileOperationsConfig = {
    fileType: PROJECT_FILE_TYPE,
    fileExtension: '.project.json',
    dialogTitle: {
        save: 'Save Project',
        load: 'Load Project',
        delete: 'Delete Project'
    },
    validateFilename: (name) => {
        // Only allow alphanumeric characters, hyphens, and underscores
        const valid = /^[a-zA-Z0-9_-]+$/.test(name);
        return {
            valid,
            message: valid ? '' : 'Project name can only contain letters, numbers, underscores, and hyphens'
        };
    }
};

/**
 * Save a project to a file
 * @param filename The name of the file to save
 * @param projectData The project data
 * @returns Promise with the result of the operation
 */
export async function saveProject(filename: string, projectData: ProjectData) {
    try {
        logger('INFO', 'ui', 'ProjectAdapter', `Saving project to ${filename}`);
        
        // Update the modified timestamp
        const updatedData = {
            ...projectData,
            modified: new Date().toISOString()
        };
        
        return await saveFile(PROJECT_FILE_TYPE, filename, updatedData);
    } catch (error) {
        logger('ERROR', 'ui', 'ProjectAdapter', `Error saving project: ${error}`);
        throw error;
    }
}

/**
 * Load a project from a file
 * @param filename The name of the file to load
 * @returns Promise with the loaded project data
 */
export async function loadProject(filename: string): Promise<ProjectData> {
    try {
        logger('INFO', 'ui', 'ProjectAdapter', `Loading project from ${filename}`);
        
        const result = await loadFile(PROJECT_FILE_TYPE, filename);
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to load project');
        }
        
        return result.data as ProjectData;
    } catch (error) {
        logger('ERROR', 'ui', 'ProjectAdapter', `Error loading project: ${error}`);
        throw error;
    }
}

/**
 * Delete a project file
 * @param filename The name of the file to delete
 * @returns Promise with the result of the operation
 */
export async function deleteProject(filename: string) {
    try {
        logger('INFO', 'ui', 'ProjectAdapter', `Deleting project ${filename}`);
        
        return await deleteFile(PROJECT_FILE_TYPE, filename);
    } catch (error) {
        logger('ERROR', 'ui', 'ProjectAdapter', `Error deleting project: ${error}`);
        throw error;
    }
}

/**
 * Create a new project
 * @param name The name of the project
 * @returns A new project data object
 */
export function createNewProject(name: string): ProjectData {
    const timestamp = new Date().toISOString();
    
    return {
        name,
        description: '',
        created: timestamp,
        modified: timestamp,
        settings: {
            theme: 'light',
            layout: 'default'
        },
        components: []
    };
} 