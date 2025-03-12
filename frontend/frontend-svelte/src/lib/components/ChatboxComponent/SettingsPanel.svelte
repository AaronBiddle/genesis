<script lang="ts">
    import { getChatStore } from './ChatStore';
    import { createEventDispatcher, onMount, onDestroy } from 'svelte';
    import { logger } from '$lib/components/LogControlPanel/logger';
    import { availableModels, fetchAvailableModels, isLoadingModels, modelError } from './ModelService';
    
    // Define namespace as a constant using path-like format
    const NAMESPACE = 'ChatboxComponent/SettingsPanel';
    
    // Accept panel ID as a prop
    export let panelId: string;
    
    // Create event dispatcher
    const dispatch = createEventDispatcher();
    
    // Get the store for this specific chat instance
    const chatStore = getChatStore(panelId);
    const { settings, settingsApplied, applySettings, resetSettings } = chatStore;
    
    // Local copy of settings for editing
    let localSettings = { ...$settings };
    
    // Update local settings when store settings change
    $: {
        localSettings = { ...$settings };
    }
    
    // Auto-save settings when they change
    $: {
        if (localSettings !== $settings) {
            settings.set(localSettings);
            logger('INFO', 'ui', NAMESPACE, `Automatically saving settings for panel ${panelId}:`, localSettings);
        }
    }
    
    // Fetch available models on component mount
    onMount(() => {
        fetchAvailableModels();
    });
    
    // Save settings when component is unmounted
    onDestroy(() => {
        saveSettings();
    });
    
    // Update settings automatically when leaving the panel
    function saveSettings(): void {
        logger('INFO', 'ui', NAMESPACE, `Automatically saving settings for panel ${panelId}:`, localSettings);
        $settings = { ...localSettings };
        applySettings();
    }
    
    // Reset settings to defaults
    function handleReset(): void {
        resetSettings();
        localSettings = { ...$settings };
    }
</script>

<div class="flex flex-col p-4 h-full overflow-auto">
    <div class="mb-4">
        <label for="model" class="block text-sm font-medium text-gray-700 mb-1">
            Model
        </label>
        {#if $isLoadingModels}
            <div class="text-sm text-gray-500">Loading models...</div>
        {:else if $modelError}
            <div class="text-sm text-red-500">Error loading models: {$modelError}</div>
        {:else}
            <select 
                id="model" 
                bind:value={localSettings.modelId} 
                class="w-full p-2 border border-gray-300 rounded-md"
            >
                {#each $availableModels as model}
                    <option value={model.id}>{model.name}</option>
                {/each}
            </select>
            <p class="text-xs text-gray-500 mt-1">
                Select the AI model to use for this conversation.
            </p>
        {/if}
    </div>
    
    <div class="mb-4">
        <label for="temperature" class="block text-sm font-medium text-gray-700 mb-1">
            Temperature: {localSettings.temperature.toFixed(1)}
        </label>
        <input 
            id="temperature" 
            type="range" 
            min="0" 
            max="2" 
            step="0.1" 
            bind:value={localSettings.temperature} 
            class="w-full"
        />
        <p class="text-xs text-gray-500 mt-1">
            Lower values make responses more focused and deterministic. Higher values make responses more creative and varied.
        </p>
    </div>
    
    <div class="mb-4">
        <label for="systemPrompt" class="block text-sm font-medium text-gray-700 mb-1">
            System Prompt
        </label>
        <textarea 
            id="systemPrompt" 
            bind:value={localSettings.systemPrompt} 
            class="w-full p-2 border border-gray-300 rounded-md h-32"
            placeholder="Enter a system prompt to guide the AI's behavior..."
        ></textarea>
        <p class="text-xs text-gray-500 mt-1">
            The system prompt helps set the behavior and role of the AI assistant.
        </p>
    </div>
    
    <div class="flex justify-start mt-4">
        <button 
            on:click={handleReset}
            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
        >
            Reset to Defaults
        </button>
    </div>
    
    {#if $settingsApplied}
        <div class="mt-4 p-2 bg-green-100 text-green-800 rounded-md">
            Settings applied successfully!
        </div>
    {/if}
</div> 