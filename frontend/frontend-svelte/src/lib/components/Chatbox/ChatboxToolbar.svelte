<script lang="ts">
    import { logger } from '$lib/components/LogControlPanel/logger';
    
    const NAMESPACE = 'Chatbox/ChatboxToolbar';
    
    // Props
    export let panelId: string;
    export let displayFilename: string | null;
    export let isLoading: boolean;
    export let showSettings: boolean;
    export let wsConnected: boolean;
    
    // Event handlers - these will dispatch events to the parent
    function handleClearChat(): void {
        dispatchEvent('clearChat');
    }
    
    function handleReconnect(): void {
        logger('INFO', 'ui', NAMESPACE, 'User initiated WebSocket reconnection');
        dispatchEvent('reconnect');
    }
    
    function toggleSettings(): void {
        dispatchEvent('toggleSettings');
    }
    
    function openSaveDialog(): void {
        dispatchEvent('openSaveDialog');
    }
    
    function openLoadDialog(): void {
        dispatchEvent('openLoadDialog');
    }
    
    // Helper function to dispatch events
    function dispatchEvent(name: string, detail: any = {}): void {
        dispatch(name, detail);
    }
    
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
</script>

<div class="flex justify-between items-center p-2 border-b border-gray-300 bg-gray-100">
    <div class="flex items-center">
        <h2 class="text-lg font-semibold mr-3">
            {#if displayFilename}
                {displayFilename}
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
                disabled={isLoading}
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
                disabled={isLoading}
            >
                <span class="material-symbols-outlined text-base">folder_open</span>
                <span class="absolute left-1/2 transform -translate-x-1/2 -bottom-8 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Load Chat
                </span>
            </button>
        </div>
    </div>
    <div class="flex items-center">
        <!-- Loading indicator -->
        {#if isLoading}
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
        {/if}
        
        <button 
            on:click={toggleSettings}
            class="p-1.5 text-sm bg-gray-100 rounded hover:bg-gray-300 transition-colors flex items-center mr-2 group relative"
            title={showSettings ? 'Back to Chat' : 'Settings'}
        >
            <span class="material-symbols-outlined text-base">{showSettings ? 'arrow_back' : 'settings'}</span>
            <span class="absolute right-0 transform translate-x-0 -bottom-8 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {showSettings ? 'Back to Chat' : 'Settings'}
            </span>
        </button>
        <!-- Connection status indicator/button -->
        {#if wsConnected}
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