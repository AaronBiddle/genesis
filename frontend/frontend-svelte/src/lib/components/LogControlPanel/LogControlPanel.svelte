<script lang="ts">
    import {
        LOG_LEVELS,
        LOG_DOMAINS,
        NAMESPACES,
        logConfigStore,
        type LogLevel
    } from './logConfig';
    
    // Keep track of namespace filter text
    let namespaceFilterText = '';
    let namespaceSearchResults = [...NAMESPACES];
    
    // UI state management
    let selectedTab: 'levels' | 'domains' | 'namespaces' = 'levels';
    
    function searchNamespaces(): void {
        if (!namespaceFilterText) {
            namespaceSearchResults = [...NAMESPACES];
            return;
        }
        
        namespaceSearchResults = NAMESPACES.filter(ns => 
            ns.toLowerCase().includes(namespaceFilterText.toLowerCase())
        );
    }
    
    // For demonstration: would be replaced with actual logger configuration
    function applySettings(): void {
        console.log('Applied log settings:', $logConfigStore);
        alert('Log settings applied! Check console for details.');
    }
    
    // Update search results when filter text changes
    $: {
        namespaceFilterText;
        searchNamespaces();
    }
</script>

<div class="flex flex-col h-full p-4">
    <h2 class="text-xl font-bold mb-4">Logging Control Panel</h2>
    
    <div class="flex border-b border-gray-200 mb-4">
        <button 
            class="px-4 py-2 {selectedTab === 'levels' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}" 
            on:click={() => selectedTab = 'levels'}
        >
            Log Levels
        </button>
        <button 
            class="px-4 py-2 {selectedTab === 'domains' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}" 
            on:click={() => selectedTab = 'domains'}
        >
            Domains
        </button>
        <button 
            class="px-4 py-2 {selectedTab === 'namespaces' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}" 
            on:click={() => selectedTab = 'namespaces'}
        >
            Namespaces
        </button>
    </div>
    
    <!-- Log Levels Tab -->
    {#if selectedTab === 'levels'}
        <div class="mb-6">
            <div class="flex justify-between items-center mb-2">
                <h3 class="text-lg font-semibold">Global Log Level</h3>
                <button 
                    on:click={logConfigStore.resetLevels}
                    class="px-2 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                    title="Reset log levels to defaults and clear all domain overrides"
                >
                    Reset Levels
                </button>
            </div>
            <p class="text-sm text-gray-600 mb-3">Set the default minimum log level for all components</p>
            
            <div class="flex flex-wrap gap-2">
                {#each LOG_LEVELS as level}
                    <button 
                        class="px-3 py-1 rounded-full text-sm border {$logConfigStore.globalLevel === level ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}"
                        on:click={() => logConfigStore.updateGlobalLevel(level)}
                    >
                        {level}
                    </button>
                {/each}
            </div>
        </div>
        
        <div>
            <h3 class="text-lg font-semibold mb-2">Domain Overrides</h3>
            <p class="text-sm text-gray-600 mb-3">Override log levels for specific functional domains</p>
            
            <div class="space-y-3">
                {#each LOG_DOMAINS as domain}
                    <div class="flex items-center">
                        <div class="w-36">{domain.label}:</div>
                        <div class="flex-1 flex items-center gap-2">
                            {#each LOG_LEVELS as level}
                                <button 
                                    class="px-2 py-0.5 rounded-full text-xs border {$logConfigStore.domainOverrides[domain.id] === level ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}"
                                    on:click={() => logConfigStore.updateDomainLevel(domain.id, level)}
                                >
                                    {level}
                                </button>
                            {/each}
                            
                            {#if $logConfigStore.domainOverrides[domain.id]}
                                <button 
                                    class="text-gray-500 hover:text-red-500 text-xs" 
                                    title="Reset to global"
                                    on:click={() => logConfigStore.resetDomainLevel(domain.id)}
                                >
                                    (reset)
                                </button>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
    
    <!-- Domains Tab -->
    {#if selectedTab === 'domains'}
        <div>
            <div class="flex justify-between items-center mb-2">
                <h3 class="text-lg font-semibold">Active Domains</h3>
                <button 
                    on:click={logConfigStore.resetDomains}
                    class="px-2 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                    title="Clear all enabled domains"
                >
                    Reset Domains
                </button>
            </div>
            <p class="text-sm text-gray-600 mb-3">Enable or disable logging for specific functional areas</p>
            
            <div class="space-y-3">
                {#each LOG_DOMAINS as domain}
                    <div class="flex items-start">
                        <label class="flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={$logConfigStore.enabledDomains.includes(domain.id)}
                                on:change={() => logConfigStore.toggleDomain(domain.id)}
                                class="form-checkbox mr-2"
                            />
                            <span class="font-medium">{domain.label}</span>
                        </label>
                        <div class="ml-2 text-sm text-gray-600">{domain.description}</div>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
    
    <!-- Namespaces Tab -->
    {#if selectedTab === 'namespaces'}
        <div>
            <div class="flex justify-between items-center mb-2">
                <h3 class="text-lg font-semibold">Namespace Filtering</h3>
                <button 
                    on:click={logConfigStore.resetNamespaces}
                    class="px-2 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                    title="Clear all namespace filters"
                >
                    Reset Namespaces
                </button>
            </div>
            <p class="text-sm text-gray-600 mb-3">Filter logs by specific modules or components</p>
            
            <div class="flex items-center mb-4">
                <button 
                    class="px-3 py-1 rounded-md border {$logConfigStore.namespaceFilterType === 'include' ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-700 border-gray-300'}"
                    on:click={logConfigStore.toggleNamespaceFilterType}
                >
                    Include
                </button>
                <button 
                    class="px-3 py-1 rounded-md border ml-2 {$logConfigStore.namespaceFilterType === 'exclude' ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-700 border-gray-300'}"
                    on:click={logConfigStore.toggleNamespaceFilterType}
                >
                    Exclude
                </button>
                <span class="ml-2 text-sm text-gray-600">
                    {$logConfigStore.namespaceFilterType === 'include' ? 'Only show these namespaces' : 'Show all except these namespaces'}
                </span>
            </div>
            
            <div class="mb-4">
                <div class="font-medium mb-2">Active Filters ({$logConfigStore.namespaceFilters.length})</div>
                {#if $logConfigStore.namespaceFilters.length === 0}
                    <div class="text-sm text-gray-500 italic">No filters applied</div>
                {:else}
                    <div class="flex flex-wrap gap-2">
                        {#each $logConfigStore.namespaceFilters as namespace}
                            <div class="bg-gray-100 rounded-full px-3 py-1 text-sm flex items-center">
                                <span class="truncate max-w-[200px]">{namespace}</span>
                                <button 
                                    class="ml-2 text-gray-400 hover:text-red-500" 
                                    on:click={() => logConfigStore.removeNamespaceFilter(namespace)}
                                >
                                    &times;
                                </button>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
            
            <div>
                <div class="font-medium mb-2">Add Namespace Filter</div>
                <div class="flex mb-2">
                    <input 
                        type="text" 
                        bind:value={namespaceFilterText} 
                        placeholder="Search namespaces..."
                        class="flex-1 border border-gray-300 rounded-md px-3 py-2 mr-2"
                    />
                </div>
                
                <div class="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                    {#if namespaceSearchResults.length === 0}
                        <div class="p-3 text-sm text-gray-500">No results found</div>
                    {:else}
                        {#each namespaceSearchResults as namespace}
                            <div 
                                role="presentation"
                                class="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 text-sm flex justify-between items-center"
                                on:click={() => logConfigStore.addNamespaceFilter(namespace)}
                            >
                                <span>{namespace}</span>
                                <button 
                                    class="text-green-500 hover:text-green-700 font-bold"
                                    title="Add to filters"
                                >
                                    +
                                </button>
                            </div>
                        {/each}
                    {/if}
                </div>
            </div>
        </div>
    {/if}
    
    <div class="mt-auto pt-4 flex justify-between border-t border-gray-200">
        <button 
            on:click={logConfigStore.resetToDefaults}
            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
        >
            Reset All
        </button>
        
        <button 
            on:click={applySettings}
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
            Apply Settings
        </button>
    </div>
</div> 