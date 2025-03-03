<script lang="ts">
    import { onMount } from 'svelte';
    import { connect } from './WebSocketService';
    import { getChatStore } from './ChatStore';
    import ChatMessages from './ChatMessages.svelte';
    import ChatInput from './ChatInput.svelte';
    import SettingsPanel from './SettingsPanel.svelte';
    
    // Accept panel ID as a prop
    export let panelId: string;
    
    // Get the store for this specific chat instance
    const chatStore = getChatStore(panelId);
    const { showSettings, wsConnected, toggleSettingsView, applySettings } = chatStore;
    
    onMount(() => {
        // Connect to the websocket endpoint on component mount with this panel's ID
        connect(panelId);
    });
    
    // Custom toggle function that applies settings when switching back to chat
    function handleToggleSettings(): void {
        // If we're currently in settings view and switching back to chat, apply settings
        if ($showSettings) {
            applySettings();
        }
        
        // Toggle the view
        toggleSettingsView();
    }
</script>

<!-- Main container -->
<div class="flex flex-col h-full">
    <div class="flex flex-col h-full min-h-0 relative overflow-hidden p-1" style="height: 100%;">
        <!-- Header with title, settings button, and connection indicator -->
        <div class="flex justify-between items-center mb-1">
            <h2 class="text-xl font-bold">{$showSettings ? 'Settings' : 'Chatbox'}</h2>
            <div class="flex items-center">
                <button 
                    aria-label={$showSettings ? "Back to Chat" : "Settings"}
                    on:click={handleToggleSettings} 
                    class="text-gray-600 hover:text-gray-800 p-1 rounded-full hover:bg-gray-200 mr-2"
                    title={$showSettings ? "Back to Chat" : "Settings"}
                >
                    {#if $showSettings}
                        <!-- Chat icon -->
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                    {:else}
                        <!-- Settings icon -->
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                    {/if}
                </button>
                <!-- Connection indicator -->
                {#if $wsConnected}
                    <span class="inline-block w-3 h-3 rounded-full bg-green-500" title="Connected"></span>
                {:else}
                    <button 
                        aria-label="Reconnect" 
                        on:click={() => connect(panelId)} 
                        class="inline-block w-3 h-3 rounded-full bg-red-500 cursor-pointer" 
                        title="Disconnected - Click to reconnect"
                    ></button>
                {/if}
            </div>
        </div>

        {#if $showSettings}
            <!-- Settings View -->
            <SettingsPanel {panelId} />
        {:else}
            <!-- Chat View -->
            <div class="flex-1 p-1 min-h-0">
                <div class="flex flex-col overflow-hidden border border-gray-200 rounded-lg h-full">
                    <ChatMessages {panelId} />
                </div>
            </div>

            <ChatInput {panelId} />
        {/if}
    </div>
</div> 