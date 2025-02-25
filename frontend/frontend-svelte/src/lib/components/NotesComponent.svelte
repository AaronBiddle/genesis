<script lang="ts">
    import { onMount } from 'svelte';
    
    let notes: string = '';
    let savedNotes: string = '';
    
    function saveNote() {
        savedNotes = notes;
    }
    
    function clearNotes() {
        notes = '';
        savedNotes = '';
    }
    
    onMount(() => {
        // Focus the textarea when the component mounts
        const textarea = document.querySelector('textarea');
        if (textarea) textarea.focus();
    });
</script>

<div class="p-4">
    <h2 class="text-xl font-bold mb-3">Notes</h2>
    
    <div class="mb-3">
        <textarea
            bind:value={notes}
            placeholder="Write your notes here..."
            rows="4"
            class="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
        ></textarea>
    </div>
    
    <div class="flex space-x-2 mb-4">
        <button 
            on:click={saveNote}
            class="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
            Save
        </button>
        
        <button 
            on:click={clearNotes}
            class="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
        >
            Clear
        </button>
    </div>
    
    {#if savedNotes}
        <div class="border border-gray-200 rounded-md p-3 bg-gray-50">
            <h3 class="text-md font-semibold mb-1">Saved Note:</h3>
            <p class="whitespace-pre-wrap">{savedNotes}</p>
        </div>
    {/if}
</div> 