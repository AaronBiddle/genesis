<script lang="ts">
    import { onMount, createEventDispatcher } from 'svelte';
    import { getDirectoryContents, createDirectory, deleteDirectory, deleteChat } from './FileOperationsService';
    import { logger } from '$lib/components/LogControlPanel/logger';
    import { API_URL } from '$lib/config';
    
    export let isOpen = false;
    export let mode: 'save' | 'load' | 'delete' = 'save';
    export let currentFilename = '';
    
    let filename = '';
    let currentPath = '';
    let availableFiles: string[] = [];
    let directories: string[] = [];
    let isLoading = false;
    let errorMessage = '';
    let showNewDirInput = false;
    let newDirectoryName = '';
    let showDeleteConfirmation = false;
    let deleteType: 'file' | 'directory' = 'file';
    let itemToDelete = '';
    let deleteInProgress = false;
    
    const dispatch = createEventDispatcher();
    
    // Load directory contents whenever the dialog is opened, regardless of mode
    $: if (isOpen) {
        loadFileList();
    }
    
    $: if (isOpen && mode === 'save' && currentFilename) {
        // Extract just the filename without path
        const parts = currentFilename.split('/');
        filename = parts[parts.length - 1];
        
        // If the current filename has a path, set the currentPath
        if (parts.length > 1) {
            parts.pop(); // Remove the filename
            currentPath = parts.join('/');
            // Reload the file list with the new path
            loadFileList();
        }
    }
    
    async function loadFileList() {
        try {
            isLoading = true;
            errorMessage = '';
            
            // Fetch directory contents using the service
            const dirContents = await getDirectoryContents(currentPath);
            availableFiles = dirContents.files;
            directories = dirContents.directories;
            
            logger('INFO', 'ui', 'FileOperationsDialog', `Loaded directory contents for path: ${currentPath || 'root'}`);
            logger('INFO', 'ui', 'FileOperationsDialog', `Found ${directories.length} directories and ${availableFiles.length} files`);
            
        } catch (error) {
            errorMessage = 'Failed to load directory contents';
            logger('ERROR', 'ui', 'FileOperationsDialog', `Error loading directory contents: ${error}`);
        } finally {
            isLoading = false;
        }
    }
    
    function navigateToDirectory(dirName: string) {
        // Handle navigation to parent directory
        if (dirName === '..') {
            const pathParts = currentPath.split('/').filter(Boolean);
            pathParts.pop();
            currentPath = pathParts.join('/');
        } else {
            // Navigate to subdirectory
            currentPath = currentPath ? `${currentPath}/${dirName}` : dirName;
        }
        
        loadFileList();
    }
    
    async function handleCreateDirectory() {
        if (!newDirectoryName.trim()) {
            errorMessage = 'Directory name cannot be empty';
            return;
        }
        
        try {
            isLoading = true;
            errorMessage = '';
            
            const dirPath = currentPath 
                ? `${currentPath}/${newDirectoryName}` 
                : newDirectoryName;
                
            await createDirectory(dirPath);
            
            // Reset new directory input
            newDirectoryName = '';
            showNewDirInput = false;
            
            // Reload file list
            await loadFileList();
            
        } catch (error) {
            errorMessage = 'Failed to create directory';
            logger('ERROR', 'ui', 'FileOperationsDialog', `Error creating directory: ${error}`);
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
        
        // Combine path and filename
        const fullPath = currentPath 
            ? `${currentPath}/${filename}` 
            : filename;
            
        dispatch('submit', { filename: fullPath, mode });
        close();
    }
    
    function handleFileSelect(file: string) {
        // Extract just the filename without path
        const parts = file.split('/');
        filename = parts[parts.length - 1];
        
        // If the file has a path, update currentPath
        if (parts.length > 1) {
            // Remove the filename to get the path
            parts.pop();
            currentPath = parts.join('/');
        }
    }
    
    function toggleNewDirInput() {
        showNewDirInput = !showNewDirInput;
        if (!showNewDirInput) {
            newDirectoryName = '';
        }
    }
    
    function close() {
        isOpen = false;
        filename = '';
        currentPath = '';
        errorMessage = '';
        showNewDirInput = false;
        newDirectoryName = '';
        dispatch('close');
    }
    
    // Helper function to extract just the filename from a path
    function getFilenameFromPath(path: string): string {
        const parts = path.split('/');
        return parts[parts.length - 1];
    }
    
    // Function to show confirmation dialog
    function confirmDelete(type: 'file' | 'directory', item: string) {
        deleteType = type;
        itemToDelete = item;
        showDeleteConfirmation = true;
    }
    
    // Function to cancel delete
    function cancelDelete() {
        showDeleteConfirmation = false;
        itemToDelete = '';
    }
    
    // Function to execute delete
    async function executeDelete() {
        if (deleteInProgress) return;
        
        try {
            deleteInProgress = true;
            
            if (deleteType === 'directory') {
                // Construct the full path
                const dirPath = currentPath 
                    ? `${currentPath}/${itemToDelete}` 
                    : itemToDelete;
                    
                await deleteDirectory(dirPath);
                logger('INFO', 'ui', 'FileOperationsDialog', `Directory deleted: ${dirPath}`);
            } else {
                // For files, we already have the full path
                await deleteChat(itemToDelete);
                logger('INFO', 'ui', 'FileOperationsDialog', `File deleted: ${itemToDelete}`);
            }
            
            // Refresh the file list
            await loadFileList();
            
            // Close the confirmation dialog
            showDeleteConfirmation = false;
            itemToDelete = '';
            
        } catch (error: any) {
            // Check for specific error messages from the backend
            if (deleteType === 'directory' && error.message && error.message.includes('must be empty')) {
                errorMessage = `Cannot delete directory "${itemToDelete}" because it is not empty. Please delete its contents first.`;
            } else {
                errorMessage = `Failed to delete ${deleteType}: ${error.message || 'Unknown error'}`;
            }
            logger('ERROR', 'ui', 'FileOperationsDialog', `Error deleting ${deleteType}: ${error}`);
            
            // Close the confirmation dialog even when there's an error
            showDeleteConfirmation = false;
        } finally {
            deleteInProgress = false;
        }
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
        
        <!-- Current path display -->
        <div class="flex items-center mb-3 text-sm text-gray-600 overflow-x-auto">
            <span class="mr-1">Path:</span>
            <span class="font-mono">/{ currentPath }</span>
        </div>
        
        <!-- Directory navigation -->
        <div class="mb-4">
            <div class="flex justify-between items-center mb-2">
                <div class="flex items-center">
                    {#if currentPath}
                        <button 
                            on:click={() => navigateToDirectory('..')}
                            class="text-blue-600 hover:text-blue-800 flex items-center mr-2"
                            title="Go up one level"
                        >
                            <span class="material-symbols-outlined text-base mr-1">arrow_upward</span>
                            <span>Up</span>
                        </button>
                    {/if}
                </div>
                
                <button 
                    on:click={toggleNewDirInput}
                    class="text-blue-600 hover:text-blue-800 flex items-center"
                    title="Create new directory"
                >
                    <span class="material-symbols-outlined text-base mr-1">create_new_folder</span>
                    <span>New Folder</span>
                </button>
            </div>
            
            {#if showNewDirInput}
                <div class="flex items-center mb-3">
                    <input 
                        type="text" 
                        bind:value={newDirectoryName} 
                        placeholder="New directory name"
                        class="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button 
                        on:click={handleCreateDirectory}
                        class="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                    >
                        Create
                    </button>
                </div>
            {/if}
            
            {#if isLoading}
                <div class="flex justify-center py-4">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            {:else}
                <!-- Directories list -->
                {#if directories.length > 0}
                    <div class="mb-3">
                        <h3 class="text-sm font-medium text-gray-700 mb-1">Directories</h3>
                        <div class="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                            {#each directories as dir}
                                <div 
                                    class="w-full text-left px-3 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 flex items-center justify-between group"
                                >
                                    <button 
                                        class="flex items-center flex-grow overflow-hidden text-ellipsis"
                                        on:click={() => navigateToDirectory(dir)}
                                    >
                                        <span class="material-symbols-outlined text-base mr-2 text-yellow-600">folder</span>
                                        <span class="truncate">{dir}</span>
                                    </button>
                                    <button 
                                        class="text-transparent group-hover:text-red-500 hover:text-red-700 focus:text-red-500 focus:outline-none ml-2"
                                        on:click|stopPropagation={() => confirmDelete('directory', dir)}
                                        title="Delete directory"
                                    >
                                        <span class="material-symbols-outlined text-base">delete</span>
                                    </button>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}
                
                {#if mode === 'save'}
                    <!-- Show files in save mode too, for reference -->
                    {#if availableFiles.length > 0}
                        <div class="mb-3">
                            <h3 class="text-sm font-medium text-gray-700 mb-1">Existing Files</h3>
                            <div class="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                                {#each availableFiles as file}
                                    <div class="px-3 py-2 flex items-center justify-between text-gray-600 group hover:bg-gray-100">
                                        <div class="flex items-center flex-grow overflow-hidden">
                                            <span class="material-symbols-outlined text-base mr-2 text-blue-600">description</span>
                                            <span class="truncate">{getFilenameFromPath(file)}</span>
                                        </div>
                                        <button 
                                            class="text-transparent group-hover:text-red-500 hover:text-red-700 focus:text-red-500 focus:outline-none ml-2"
                                            on:click|stopPropagation={() => confirmDelete('file', file)}
                                            title="Delete file"
                                        >
                                            <span class="material-symbols-outlined text-base">delete</span>
                                        </button>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}
                    
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
                    <!-- Files list -->
                    {#if availableFiles.length === 0}
                        <p class="text-gray-500 text-center py-4">No files available in this directory</p>
                    {:else}
                        <h3 class="text-sm font-medium text-gray-700 mb-1">Files</h3>
                        <div class="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                            {#each availableFiles as file}
                                <div 
                                    class="w-full text-left px-3 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 {filename === getFilenameFromPath(file) ? 'bg-blue-50' : ''} flex items-center justify-between group"
                                >
                                    <button 
                                        class="flex items-center flex-grow overflow-hidden"
                                        on:click={() => handleFileSelect(file)}
                                    >
                                        <span class="material-symbols-outlined text-base mr-2 text-blue-600">description</span>
                                        <span class="truncate">{getFilenameFromPath(file)}</span>
                                    </button>
                                    <button 
                                        class="text-transparent group-hover:text-red-500 hover:text-red-700 focus:text-red-500 focus:outline-none ml-2"
                                        on:click|stopPropagation={() => confirmDelete('file', file)}
                                        title="Delete file"
                                    >
                                        <span class="material-symbols-outlined text-base">delete</span>
                                    </button>
                                </div>
                            {/each}
                        </div>
                    {/if}
                {/if}
            {/if}
        </div>
        
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

<!-- Add confirmation dialog -->
{#if showDeleteConfirmation}
<div class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Confirm Deletion</h3>
        <p class="mb-6 text-gray-700">
            {#if deleteType === 'directory'}
                Are you sure you want to delete the directory "{itemToDelete}"?
                <br><span class="text-gray-600 text-sm">Note: Only empty directories can be deleted.</span>
            {:else}
                Are you sure you want to delete the file "{getFilenameFromPath(itemToDelete)}"?
            {/if}
        </p>
        
        <div class="flex justify-end space-x-3">
            <button 
                class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                on:click={cancelDelete}
            >
                Cancel
            </button>
            <button 
                class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                on:click={executeDelete}
                disabled={deleteInProgress}
            >
                {#if deleteInProgress}
                    <span class="inline-block animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1"></span>
                    Deleting...
                {:else}
                    Delete
                {/if}
            </button>
        </div>
    </div>
</div>
{/if} 