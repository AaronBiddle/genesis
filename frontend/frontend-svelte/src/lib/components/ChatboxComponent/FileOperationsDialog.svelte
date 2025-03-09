<script lang="ts">
    import { onMount, createEventDispatcher } from 'svelte';
    import { listChats } from './FileOperationsService';
    import { logger } from '$lib/components/LogControlPanel/logger';
    
    export let isOpen = false;
    export let mode: 'save' | 'load' | 'delete' = 'save';
    export let currentFilename = '';
    
    let filename = '';
    let availableFiles: string[] = [];
    let isLoading = false;
    let errorMessage = '';
    
    const dispatch = createEventDispatcher();
    
    $: if (isOpen && mode !== 'save') {
        loadFileList();
    }
    
    $: if (isOpen && mode === 'save' && currentFilename) {
        filename = currentFilename;
    }
    
    async function loadFileList() {
        try {
            isLoading = true;
            errorMessage = '';
            availableFiles = await listChats();
        } catch (error) {
            errorMessage = 'Failed to load file list';
            logger('ERROR', 'ui', 'FileOperationsDialog', `Error loading file list: ${error}`);
        } finally {
            isLoading = false;
        }
    }
    
    function handleSubmit() {
        if (!filename.trim()) {
            errorMessage = 'Filename is required';
            return;
        }
        
        // Add .json extension if not present
        if (!filename.endsWith('.json')) {
            filename = `${filename}.json`;
        }
        
        dispatch('submit', { filename, mode });
        close();
    }
    
    function handleFileSelect(selectedFilename: string) {
        filename = selectedFilename;
    }
    
    function close() {
        isOpen = false;
        filename = '';
        errorMessage = '';
        dispatch('close');
    }
</script>

{#if isOpen}
<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold">
                {#if mode === 'save'}
                    Save Chat
                {:else if mode === 'load'}
                    Load Chat
                {:else}
                    Delete Chat
                {/if}
            </h2>
            <button 
                on:click={close}
                class="text-gray-500 hover:text-gray-700"
            >
                <span class="material-symbols-outlined">close</span>
            </button>
        </div>
        
        {#if errorMessage}
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {errorMessage}
            </div>
        {/if}
        
        {#if mode === 'save'}
            <div class="mb-4">
                <label for="filename" class="block text-sm font-medium text-gray-700 mb-1">Filename</label>
                <input 
                    type="text" 
                    id="filename" 
                    bind:value={filename} 
                    placeholder="Enter filename"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p class="text-xs text-gray-500 mt-1">
                    .json extension will be added automatically if not provided
                </p>
            </div>
        {:else}
            <div class="mb-4">
                {#if isLoading}
                    <div class="flex justify-center py-4">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                {:else if availableFiles.length === 0}
                    <p class="text-gray-500 text-center py-4">No files available</p>
                {:else}
                    <div class="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                        {#each availableFiles as file}
                            <button 
                                class="w-full text-left px-3 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 {filename === file ? 'bg-blue-50' : ''}"
                                on:click={() => handleFileSelect(file)}
                            >
                                {file}
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>
        {/if}
        
        <div class="flex justify-end space-x-2">
            <button 
                on:click={close}
                class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
                Cancel
            </button>
            <button 
                on:click={handleSubmit}
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || (!filename && mode !== 'save')}
            >
                {#if mode === 'save'}
                    Save
                {:else if mode === 'load'}
                    Load
                {:else}
                    Delete
                {/if}
            </button>
        </div>
    </div>
</div>
{/if} 