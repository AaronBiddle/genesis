import { writable } from 'svelte/store';
import { API_URL } from '$lib/config.js';
import { logger } from '$lib/components/LogControlPanel/logger';

export interface Model {
    id: string;
    name: string;
    description: string;
}

// Store for available models
export const availableModels = writable<Model[]>([]);
export const isLoadingModels = writable<boolean>(false);
export const modelError = writable<string | null>(null);

// Fetch available models from the backend
export async function fetchAvailableModels(): Promise<void> {
    isLoadingModels.set(true);
    modelError.set(null);
    
    try {
        logger('INFO', 'network', 'ModelService', 'Fetching available models');
        const response = await fetch(`${API_URL}/api/models`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch models: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data && data.models) {
            const modelsList = Object.entries(data.models).map(([id, modelData]: [string, any]) => ({
                id,
                name: modelData.name || id,
                description: modelData.description || ''
            }));
            
            logger('INFO', 'network', 'ModelService', `Fetched ${modelsList.length} models`);
            availableModels.set(modelsList);
        } else {
            throw new Error('Invalid response format from models API');
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        logger('ERROR', 'network', 'ModelService', `Error fetching models: ${errorMessage}`);
        modelError.set(errorMessage);
        availableModels.set([]);
    } finally {
        isLoadingModels.set(false);
    }
} 