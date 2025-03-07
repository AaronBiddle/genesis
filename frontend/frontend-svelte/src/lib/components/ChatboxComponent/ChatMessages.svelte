<script lang="ts">
    import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
    import { getChatStore } from './ChatStore';
    
    // Accept panel ID as a prop
    export let panelId: string;
    
    // Get the store for this specific chat instance
    const chatStore = getChatStore(panelId);
    const { messages, toggleMarkdownRendering, toggleReasoningDisplay } = chatStore;
</script>

<div class="flex-1 overflow-y-auto p-3">
    {#each $messages as message (message.id)}
        <div class="mb-2 {message.sender === 'user' ? 'text-right' : 'text-left'}">
            {#if message.sender === 'assistant'}
                <div class="relative inline-block max-w-[95%] px-4 rounded-lg bg-gray-200 text-gray-800 mr-auto group">
                    {#if message.renderMarkdown === false}
                        <span>{message.text}</span>
                    {:else}
                        <MarkdownRenderer content={message.text} />
                    {/if}
                    
                    {#if message.reasoning}
                        <div class="mt-2 flex gap-2">
                            <button 
                                on:click={() => toggleReasoningDisplay(message.id)} 
                                class="bg-gray-300 text-xs px-1 py-0.5 rounded hover:bg-gray-400"
                            >
                                {message.showReasoning ? 'Hide Reasoning' : 'Show Reasoning'}
                            </button>
                            
                            <button 
                                on:click={() => toggleMarkdownRendering(message.id)} 
                                class="bg-gray-300 text-xs px-1 py-0.5 rounded hover:bg-gray-400"
                            >
                                {message.renderMarkdown === false ? '<>' : '<>'}
                            </button>
                        </div>
                        
                        {#if message.showReasoning}
                            <div class="mt-2 p-2 border-t border-gray-300 text-sm">
                                <div class="font-semibold">Reasoning:</div>
                                {#if message.renderMarkdown === false}
                                    <pre class="whitespace-pre-wrap">{message.reasoning}</pre>
                                {:else}
                                    <MarkdownRenderer content={message.reasoning} />
                                {/if}
                            </div>
                        {/if}
                    {:else}
                        <button 
                            on:click={() => toggleMarkdownRendering(message.id)} 
                            class="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-300 text-xs px-1 py-0.5 rounded"
                        >
                            {message.renderMarkdown === false ? '<>' : '<>'}
                        </button>
                    {/if}
                </div>
            {:else}
                <div class="inline-block max-w-[95%] px-4 py-1 rounded-lg bg-blue-500 text-white ml-auto">
                    <span>{message.text}</span>
                </div>
            {/if}
        </div>
    {/each}
</div> 