<script lang="ts">
    import { getChatStore } from './ChatStore';
    
    // Accept panel ID as a prop
    export let panelId: string;
    
    // Get the store for this specific chat instance
    const chatStore = getChatStore(panelId);
    const { settings, settingsApplied, applySettings, resetSettings } = chatStore;
    
    function updateSettings(): void {
        // Log the updated settings
        console.log(`Settings updated for chat ${panelId}:`, $settings);
        
        // Show confirmation and hide after delay
        applySettings();
    }
</script>

<div class="flex-1 p-3 border border-gray-200 rounded-lg overflow-y-auto">
    <div class="space-y-6">
        <div>
            <h3 class="text-lg font-medium mb-3">Model Settings</h3>
            <div class="space-y-5 pl-2">
                <div>
                    <label for="temperature" class="block text-sm font-medium mb-1">Temperature: {$settings.temperature}</label>
                    <div class="flex items-center">
                        <span class="text-xs mr-2">0.1</span>
                        <input 
                            type="range" 
                            id="temperature" 
                            min="0.1" 
                            max="2.0" 
                            step="0.1" 
                            bind:value={$settings.temperature} 
                            class="w-full"
                        >
                        <span class="text-xs ml-2">2.0</span>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">
                        Lower values make responses more focused and deterministic. Higher values make responses more creative and varied.
                    </p>
                </div>
                
                <div>
                    <label for="system-prompt" class="block text-sm font-medium mb-1">System Prompt</label>
                    <textarea 
                        id="system-prompt" 
                        bind:value={$settings.systemPrompt} 
                        class="w-full px-2 py-1 border border-gray-300 rounded resize-vertical"
                        rows="4"
                    ></textarea>
                    <p class="text-xs text-gray-500 mt-1">
                        This sets the behavior and context for the AI assistant.
                    </p>
                </div>
            </div>
        </div>
        
        <div class="flex justify-between items-center">
            <div class="text-sm">
                {#if $settingsApplied}
                    <span class="text-green-600 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                        </svg>
                        Settings applied
                    </span>
                {/if}
            </div>
            <div class="flex space-x-2">
                <button 
                    on:click={resetSettings}
                    class="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
                    title="Reset to default settings"
                >
                    Reset
                </button>
                <button 
                    on:click={updateSettings}
                    class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                    Apply Settings
                </button>
            </div>
        </div>
        
        <div class="text-xs text-gray-500 border-t pt-3">
            <p>These settings will be applied to your next message.</p>
            <p class="mt-1">Settings are automatically applied when returning to chat.</p>
        </div>
    </div>
</div> 