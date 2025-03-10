<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import ChatInput from './ChatInput.svelte';
    import ChatMessages from './ChatMessages.svelte';
    import SettingsPanel from './SettingsPanel.svelte';
    import { getChatStore } from './ChatStore';
    import { registerSession, unregisterSession, reconnectWebSocket } from './WebSocketService';
    import { logger } from '$lib/components/LogControlPanel/logger';
    
    // Import the new FileOperations components
    import { FileOperationsDialog } from '$lib/components/FileOperations';
    import { adapters } from '$lib/components/FileOperations';
    
    // Accept panel ID as a prop
    export let panelId: string;
    
    // Get the store for this specific chat instance
    const chatStore = getChatStore(panelId);
    const { 
        showSettings, 
        wsConnected, 
        clearMessages, 
        isLoading, 
        currentFilename,
        displayFilename,
        saveCurrentChat,
        loadChatFromFile,
        deleteChatFile
    } = chatStore;
    
    // Extract chat adapter functions and config
    const { CHAT_FILE_TYPE, chatFileConfig } = adapters;
    
    // File operations dialog state
    let showFileDialog = false;
    let fileDialogMode: 'save' | 'load' | 'delete' = 'save';
    
    // Register this session with the WebSocket service on mount
    onMount(() => {
        logger('INFO', 'ui', 'ChatboxComponent', `ChatboxComponent mounted with panelId: ${panelId}`);
        registerSession(panelId);
    });
    
    // Unregister this session when the component is destroyed
    onDestroy(() => {
        logger('INFO', 'ui', 'ChatboxComponent', `ChatboxComponent destroyed with panelId: ${panelId}`);
        unregisterSession(panelId);
    });
    
    function toggleSettings(): void {
        $showSettings = !$showSettings;
    }
    
    function backToChat(): void {
        $showSettings = false;
    }

    function handleClearChat(): void {
        clearMessages();
    }
    
    function handleReconnect(): void {
        logger('INFO', 'ui', 'ChatboxComponent', 'User initiated WebSocket reconnection');
        reconnectWebSocket();
    }
    
    // File operations functions
    function openSaveDialog(): void {
        fileDialogMode = 'save';
        showFileDialog = true;
    }
    
    function openLoadDialog(): void {
        fileDialogMode = 'load';
        showFileDialog = true;
    }
    
    function openDeleteDialog(): void {
        fileDialogMode = 'delete';
        showFileDialog = true;
    }
    
    async function handleFileOperation(event: CustomEvent): Promise<void> {
        const { filename, mode } = event.detail;
        
        try {
            if (mode === 'save') {
                await saveCurrentChat(filename);
            } else if (mode === 'load') {
                await loadChatFromFile(filename);
            } else if (mode === 'delete') {
                await deleteChatFile(filename);
            }
        } catch (error) {
            logger('ERROR', 'ui', 'ChatboxComponent', `File operation failed: ${error}`);
            // In a real app, you would show an error message to the user
        }
    }
</script>

<svelte:head>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
</svelte:head>

<div class="flex flex-col h-full border border-gray-300 rounded-lg overflow-hidden bg-white">
    <div class="flex justify-between items-center p-2 border-b border-gray-300 bg-gray-100">
        <div class="flex items-center">
            <h2 class="text-lg font-semibold mr-3">
                {#if $displayFilename}
                    {$displayFilename}
                {:else}
                    Chat {panelId}
                {/if}
            </h2>
            <button 
                on:click={handleClearChat}
                class="p-1.5 text-sm bg-gray-100 rounded hover:bg-gray-300 transition-colors flex items-center group relative"
                title="New Chat"
            >
                <span class="material-symbols-outlined text-base">note_add</span>
                <span class="absolute left-1/2 transform -translate-x-1/2 -bottom-8 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    New Chat
                </span>
            </button>
            
            <!-- File operation buttons -->
            <div class="flex ml-2">
                <!-- Save button -->
                <button 
                    on:click={openSaveDialog}
                    class="p-1.5 text-sm bg-gray-100 rounded hover:bg-gray-300 transition-colors flex items-center group relative ml-1"
                    title="Save Chat"
                    disabled={$isLoading}
                >
                    <span class="material-symbols-outlined text-base">save</span>
                    <span class="absolute left-1/2 transform -translate-x-1/2 -bottom-8 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Save Chat
                    </span>
                </button>
                
                <!-- Load button -->
                <button 
                    on:click={openLoadDialog}
                    class="p-1.5 text-sm bg-gray-100 rounded hover:bg-gray-300 transition-colors flex items-center group relative ml-1"
                    title="Load Chat"
                    disabled={$isLoading}
                >
                    <span class="material-symbols-outlined text-base">folder_open</span>
                    <span class="absolute left-1/2 transform -translate-x-1/2 -bottom-8 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Load Chat
                    </span>
                </button>
                
                <!-- Delete button -->
                <button 
                    on:click={openDeleteDialog}
                    class="p-1.5 text-sm bg-gray-100 rounded hover:bg-gray-300 transition-colors flex items-center group relative ml-1"
                    title="Delete Chat"
                    disabled={$isLoading || !$currentFilename}
                >
                    <span class="material-symbols-outlined text-base">delete</span>
                    <span class="absolute left-1/2 transform -translate-x-1/2 -bottom-8 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Delete Chat
                    </span>
                </button>
            </div>
        </div>
        <div class="flex items-center">
            <!-- Loading indicator -->
            {#if $isLoading}
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
            {/if}
            
            <button 
                on:click={toggleSettings}
                class="p-1.5 text-sm bg-gray-100 rounded hover:bg-gray-300 transition-colors flex items-center mr-2 group relative"
                title={$showSettings ? 'Back to Chat' : 'Settings'}
            >
                <span class="material-symbols-outlined text-base">{$showSettings ? 'arrow_back' : 'settings'}</span>
                <span class="absolute right-0 transform translate-x-0 -bottom-8 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {$showSettings ? 'Back to Chat' : 'Settings'}
                </span>
            </button>
            <!-- Connection status indicator/button -->
            {#if $wsConnected}
                <div class="w-3 h-3 rounded-full bg-green-500 relative group" 
                     title="Connected">
                    <span class="absolute right-0 transform translate-x-0 -bottom-8 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Connected
                    </span>
                </div>
            {:else}
                <button 
                    on:click={handleReconnect}
                    class="p-1.5 bg-gray-100 rounded hover:bg-gray-300 transition-colors relative group" 
                    title="Disconnected - Click to reconnect">
                    <div class="w-3 h-3 rounded-full bg-red-500"></div>
                    <span class="absolute right-0 transform translate-x-0 -bottom-8 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Disconnected - Click to reconnect
                    </span>
                </button>
            {/if}
        </div>
    </div>
    
    {#if $showSettings}
        <SettingsPanel {panelId} on:back={backToChat} />
    {:else}
        <div class="flex flex-col flex-1 overflow-hidden">
            <ChatMessages {panelId} />
            <ChatInput {panelId} />
        </div>
    {/if}
    
    <!-- File operations dialog using the new generic component -->
    <FileOperationsDialog 
        bind:isOpen={showFileDialog}
        bind:mode={fileDialogMode}
        currentFilename={$currentFilename}
        fileType={CHAT_FILE_TYPE}
        config={chatFileConfig}
        on:submit={handleFileOperation}
    />
</div> 