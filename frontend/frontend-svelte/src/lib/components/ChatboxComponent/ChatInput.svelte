<script lang="ts">
    import { sendMessage } from './WebSocketService';
    import { getChatStore } from './ChatStore';
    
    // Accept panel ID as a prop
    export let panelId: string;
    
    // Get the store for this specific chat instance
    const chatStore = getChatStore(panelId);
    const { newMessage, addUserMessage } = chatStore;

    function handleSend(): void {
        if (!$newMessage.trim()) return;
        
        // Add user message to chat
        addUserMessage($newMessage);
        
        // Send message via WebSocket
        sendMessage(panelId, $newMessage);
        
        // Clear the input
        $newMessage = '';
    }
    
    function handleKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSend();
        }
    }
</script>

<div class="flex flex-none p-1">
    <textarea 
        bind:value={$newMessage} 
        on:keydown={handleKeyDown}
        class="flex-1 px-2 border border-gray-300 rounded-lg mr-2 resize-none"
        rows="2"
        placeholder="Type your message here..."
    ></textarea>
    <button 
        on:click={handleSend}
        class="px-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        disabled={!$newMessage.trim()}
    >
        Send
    </button>
</div> 