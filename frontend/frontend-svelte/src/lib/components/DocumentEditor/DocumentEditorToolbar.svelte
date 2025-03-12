<script lang="ts">
    import { logger } from '$lib/components/LogControlPanel/logger';
    import { createEventDispatcher } from 'svelte';
    
    const NAMESPACE = 'DocumentEditor/DocumentEditorToolbar';
    
    // Props
    export let panelId: string;
    export let filename: string;
    export let isEditing: boolean;
    
    // Event dispatcher
    const dispatch = createEventDispatcher();
    
    // Event handlers
    function createNewDocument(): void {
        dispatch('createNewDocument');
        logger('INFO', 'ui', NAMESPACE, 'Create new document button clicked');
    }
    
    function openSaveDialog(): void {
        dispatch('openSaveDialog');
        logger('INFO', 'ui', NAMESPACE, 'Save document button clicked');
    }
    
    function openLoadDialog(): void {
        dispatch('openLoadDialog');
        logger('INFO', 'ui', NAMESPACE, 'Open document button clicked');
    }
    
    function toggleMode(): void {
        dispatch('toggleMode');
        logger('INFO', 'ui', NAMESPACE, 'Toggle mode button clicked');
    }
</script>

<div class="flex justify-between items-center p-2 border-b border-gray-300 bg-gray-100">
    <div class="flex items-center">
        <h2 class="text-lg font-semibold mr-3">
            {filename ? filename : `Document ${panelId}`}
        </h2>
        <button 
            on:click={createNewDocument}
            class="p-1.5 text-sm bg-gray-100 rounded hover:bg-gray-300 transition-colors flex items-center group relative"
            title="New Document"
        >
            <span class="material-symbols-outlined text-base">note_add</span>
            <span class="absolute left-1/2 transform -translate-x-1/2 -bottom-8 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                New Document
            </span>
        </button>
        
        <!-- File operation buttons -->
        <div class="flex ml-2">
            <!-- Save button -->
            <button 
                on:click={openSaveDialog}
                class="p-1.5 text-sm bg-gray-100 rounded hover:bg-gray-300 transition-colors flex items-center group relative ml-1"
                title="Save Document"
            >
                <span class="material-symbols-outlined text-base">save</span>
                <span class="absolute left-1/2 transform -translate-x-1/2 -bottom-8 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Save Document
                </span>
            </button>
            
            <!-- Open button -->
            <button 
                on:click={openLoadDialog}
                class="p-1.5 text-sm bg-gray-100 rounded hover:bg-gray-300 transition-colors flex items-center group relative ml-1"
                title="Open Document"
            >
                <span class="material-symbols-outlined text-base">folder_open</span>
                <span class="absolute left-1/2 transform -translate-x-1/2 -bottom-8 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Open Document
                </span>
            </button>
        </div>
    </div>
    <div class="flex items-center">
        <button 
            on:click={toggleMode}
            class="p-1.5 text-sm bg-gray-100 rounded hover:bg-gray-300 transition-colors flex items-center group relative"
            title={isEditing ? 'Preview' : 'Edit'}
        >
            <span class="material-symbols-outlined text-base">{isEditing ? 'visibility' : 'edit'}</span>
            <span class="absolute right-0 transform translate-x-0 -bottom-8 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {isEditing ? 'Preview' : 'Edit'}
            </span>
        </button>
    </div>
</div> 