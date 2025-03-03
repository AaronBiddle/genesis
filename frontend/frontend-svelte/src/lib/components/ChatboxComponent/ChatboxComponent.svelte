<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import ChatInput from './ChatInput.svelte';
    import ChatMessages from './ChatMessages.svelte';
    import SettingsPanel from './SettingsPanel.svelte';
    import { getChatStore } from './ChatStore';
    import { registerSession, unregisterSession } from './WebSocketService';
    
    // Accept panel ID as a prop
    export let panelId: string;
    
    // Get the store for this specific chat instance
    const chatStore = getChatStore(panelId);
    const { showSettings, wsConnected } = chatStore;
    
    // Register this session with the WebSocket service on mount
    onMount(() => {
        console.log(`ChatboxComponent mounted with panelId: ${panelId}`);
        registerSession(panelId);
    });
    
    // Unregister this session when the component is destroyed
    onDestroy(() => {
        console.log(`ChatboxComponent destroyed with panelId: ${panelId}`);
        unregisterSession(panelId);
    });
    
    function toggleSettings(): void {
        $showSettings = !$showSettings;
    }
    
    function backToChat(): void {
        $showSettings = false;
    }
</script>

<div class="flex flex-col h-full border border-gray-300 rounded-lg overflow-hidden bg-white">
    <div class="flex justify-between items-center p-2 border-b border-gray-300 bg-gray-100">
        <h2 class="text-lg font-semibold">Chat {panelId}</h2>
        <div class="flex items-center">
            <!-- Connection status indicator -->
            <div class="w-3 h-3 rounded-full mr-2 {$wsConnected ? 'bg-green-500' : 'bg-red-500'}" 
                 title={$wsConnected ? 'Connected' : 'Disconnected'}>
            </div>
            <button 
                on:click={toggleSettings}
                class="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            >
                {$showSettings ? 'Back to Chat' : 'Settings'}
            </button>
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
</div> 