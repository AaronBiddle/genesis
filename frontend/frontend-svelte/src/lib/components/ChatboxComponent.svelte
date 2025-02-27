<script lang="ts">
    import { onMount } from 'svelte';
    
    interface Message {
        id: number;
        text: string;
        sender: 'user' | 'system';
        timestamp: Date;
    }
    
    let messages: Message[] = [];
    let newMessage = '';
    let messageContainer: HTMLElement;
    
    // Add some sample messages for demonstration
    onMount(() => {
        messages = [
            {
                id: 1,
                text: 'Hello! How can I help you today?',
                sender: 'system',
                timestamp: new Date()
            }
        ];
    });
    
    function sendMessage() {
        if (!newMessage.trim()) return;
        
        // Add user message
        const userMessage: Message = {
            id: messages.length + 1,
            text: newMessage.trim(),
            sender: 'user',
            timestamp: new Date()
        };
        
        messages = [...messages, userMessage];
        newMessage = '';
        
        // Simulate a response after a short delay
        setTimeout(() => {
            const systemMessage: Message = {
                id: messages.length + 1,
                text: `I received your message: "${userMessage.text}"`,
                sender: 'system',
                timestamp: new Date()
            };
            
            messages = [...messages, systemMessage];
            
            // Scroll to bottom
            if (messageContainer) {
                setTimeout(() => {
                    messageContainer.scrollTop = messageContainer.scrollHeight;
                }, 0);
            }
        }, 1000);
    }
    
    function handleKeyDown(event: KeyboardEvent) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    }
    
    // Auto-scroll when messages update
    $: if (messageContainer && messages.length) {
        setTimeout(() => {
            messageContainer.scrollTop = messageContainer.scrollHeight;
        }, 0);
    }
</script>

<div class="flex flex-col h-full p-4">
    <h2 class="text-xl font-bold mb-4">Chatbox</h2>
    
    <div bind:this={messageContainer} class="flex-1 overflow-y-auto mb-4 border border-gray-200 rounded-lg p-3">
        {#each messages as message (message.id)}
            <div class="mb-3 {message.sender === 'user' ? 'text-right' : 'text-left'}">
                <div class="inline-block max-w-[80%] px-4 py-2 rounded-lg {message.sender === 'user' ? 'bg-blue-500 text-white ml-auto' : 'bg-gray-200 text-gray-800 mr-auto'}">
                    <p>{message.text}</p>
                    <p class="text-xs mt-1 opacity-70">
                        {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                </div>
            </div>
        {/each}
    </div>
    
    <div class="flex">
        <textarea 
            bind:value={newMessage} 
            on:keydown={handleKeyDown}
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg mr-2 resize-none"
            rows="2"
            placeholder="Type your message here..."
        ></textarea>
        
        <button 
            on:click={sendMessage}
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors self-end"
            disabled={!newMessage.trim()}
        >
            Send
        </button>
    </div>
</div> 