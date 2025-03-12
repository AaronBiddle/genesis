<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import ChatInput from './ChatInput.svelte';
    import ChatMessages from './ChatMessages.svelte';
    import SettingsPanel from './SettingsPanel.svelte';
    import { getChatStore } from './ChatStore';
    import { registerSession, unregisterSession, reconnectWebSocket, connectionStatus } from './WebSocketService';
    import { logger } from '$lib/components/LogControlPanel/logger';
    
    // Import the new FileOperations components
    import { FileOperationsDialog } from '$lib/components/FileOperations';
    import { adapters } from '$lib/components/FileOperations';
    
    // Import the new ChatboxToolbar component
    import ChatboxToolbar from './ChatboxToolbar.svelte';
    
    // Define namespace as a constant using path-like format
    const NAMESPACE = 'Chatbox/Chatbox';
    
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
        logger('INFO', 'ui', NAMESPACE, `Chatbox mounted with panelId: ${panelId}`);
        registerSession(panelId);
    });
    
    // Unregister this session when the component is destroyed
    onDestroy(() => {
        logger('INFO', 'ui', NAMESPACE, `Chatbox destroyed with panelId: ${panelId}`);
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
        logger('INFO', 'ui', NAMESPACE, 'User initiated WebSocket reconnection');
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
            logger('ERROR', 'ui', NAMESPACE, `File operation failed: ${error}`);
            // In a real app, you would show an error message to the user
        }
    }
</script>

<svelte:head>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
</svelte:head>

<div class="flex flex-col h-full border border-gray-300 rounded-lg overflow-hidden bg-white">
    <ChatboxToolbar 
        {panelId}
        displayFilename={$displayFilename}
        isLoading={$isLoading}
        showSettings={$showSettings}
        wsConnected={$wsConnected}
        on:clearChat={handleClearChat}
        on:reconnect={handleReconnect}
        on:toggleSettings={toggleSettings}
        on:openSaveDialog={openSaveDialog}
        on:openLoadDialog={openLoadDialog}
    />
    
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
        on:fileOperation={handleFileOperation}
    />
</div> 