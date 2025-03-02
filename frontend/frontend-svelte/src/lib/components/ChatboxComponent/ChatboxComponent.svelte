<script lang="ts">
    import { onMount } from 'svelte';
    import { WS_URL } from '$lib/config.js';
    import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
    
    interface Message {
        id: number;
        text: string;
        sender: 'user' | 'system';
        timestamp: Date;
        renderMarkdown?: boolean; // optional flag to enable markdown rendering (default true)
    }
    
    let messages: Message[] = [];
    let newMessage = '';
    let messageContainer: HTMLElement;

    let ws: WebSocket;
    let currentResponseId: number | null = null;
    let wsConnected: boolean = false;

    // New function to toggle markdown rendering for a system message
    function toggleMarkdown(id: number) {
        messages = messages.map(msg => {
            if (msg.id === id) {
                return { ...msg, renderMarkdown: msg.renderMarkdown === false ? true : false };
            }
            return msg;
        });
    }

    // New function to initialize websocket connection
    function connect() {
        ws = new WebSocket(`${WS_URL}/ws/chat`);
        
        ws.onopen = () => {
            console.log('WebSocket connected');
            wsConnected = true;
        };

        ws.onclose = () => {
            console.log('WebSocket closed');
            wsConnected = false;
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            wsConnected = false;
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                // Handle error messages
                if (data.error) {
                    // Append error as a system message
                    const errorMsg: Message = {
                        id: messages.length + 1,
                        text: `Error: ${data.error}${data.details ? ' - ' + data.details : ''}`,
                        sender: 'system',
                        timestamp: new Date(),
                        renderMarkdown: true
                    };
                    messages = [...messages, errorMsg];
                    currentResponseId = null;
                    return;
                }

                // Handle streaming tokens
                if (data.token !== undefined) {
                    if (currentResponseId === null) {
                        // Create a new system message for the response, default to markdown enabled
                        currentResponseId = messages.length + 1;
                        messages = [...messages, {
                            id: currentResponseId,
                            text: data.token,
                            sender: 'system',
                            timestamp: new Date(),
                            renderMarkdown: true
                        }];
                    } else {
                        // Append token to the last system message
                        messages = messages.map(msg => {
                            if (msg.id === currentResponseId) {
                                return { ...msg, text: msg.text + data.token };
                            }
                            return msg;
                        });
                    }
                }

                // If done flag is received, reset current response
                if (data.done) {
                    currentResponseId = null;
                }
            } catch (e) {
                console.error('Error parsing websocket message:', e);
            }
        };
    }
    
    onMount(() => {
        // Connect to the websocket endpoint
        connect();
    });
    
    function sendMessage() {
        if (!newMessage.trim()) return;
        
        // Add user message to chat
        const userMessage: Message = {
            id: messages.length + 1,
            text: newMessage.trim(),
            sender: 'user',
            timestamp: new Date()
        };
        messages = [...messages, userMessage];

        // Prepare payload for websocket
        const payload = {
            prompt: newMessage.trim(),
            history: messages.map(msg => ({ role: msg.sender, content: msg.text }))
        };
        
        // Send payload if websocket is open
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(payload));
        } else {
            console.error('WebSocket is not connected.');
            const errorMsg: Message = {
                id: messages.length + 1,
                text: 'Error: Not connected to server',
                sender: 'system',
                timestamp: new Date(),
                renderMarkdown: true
            };
            messages = [...messages, errorMsg];
        }

        // Clear the input and prepare for response
        newMessage = '';
        currentResponseId = null; // will be set on receiving first token
    }
    
    function handleKeyDown(event: KeyboardEvent) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    }
</script>

<!-- Connection status indicator -->
<div class="flex flex-col h-full" style="position: relative;">
    <div style="position: absolute; top: 8px; right: 8px; z-index: 9999; pointer-events: auto;">
        {#if wsConnected}
            <span style="display:inline-block; width:12px; height:12px; border-radius:50%; background-color: green;"></span>
        {:else}
            <button aria-label="Reconnect" on:click={connect} style="background-color: red; border: none; border-radius: 50%; width:12px; height:12px; cursor: pointer; pointer-events: auto; position: relative; z-index: 9999 !important;" title="Reconnect"></button>
        {/if}
    </div>

    <div class="flex flex-col h-full min-h-0 relative overflow-hidden p-1" style="height: 100%; z-index: 1;">
        <h2 class="text-xl font-bold mb-1">Chatbox</h2>

        <div class="flex-1 p-1 min-h-0">
            <div class="flex flex-col overflow-hidden border border-gray-200 rounded-lg h-full">
                <div bind:this={messageContainer} class="flex-1 overflow-y-auto p-3">
                    {#each messages as message (message.id)}
                        <div class="mb-2 {message.sender === 'user' ? 'text-right' : 'text-left'}">
                            {#if message.sender === 'system'}
                                <div class="relative inline-block max-w-[95%] px-4 rounded-lg bg-gray-200 text-gray-800 mr-auto group">
                                    {#if message.renderMarkdown === false}
                                        <span>{message.text}</span>
                                    {:else}
                                        <MarkdownRenderer content={message.text} />
                                    {/if}
                                    <button on:click={() => toggleMarkdown(message.id)} class="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-300 text-xs px-1 py-0.5 rounded">
                                        {message.renderMarkdown === false ? '<>' : '<>'}
                                    </button>
                                </div>
                            {:else}
                                <div class="inline-block max-w-[95%] px-4 py-1 rounded-lg bg-blue-500 text-white ml-auto">
                                    <span>{message.text}</span>
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>
        </div>

        <div class="flex flex-none p-1">
            <textarea 
                bind:value={newMessage} 
                on:keydown={handleKeyDown}
                class="flex-1 px-2 border border-gray-300 rounded-lg mr-2 resize-none"
                rows="2"
                placeholder="Type your message here..."
            ></textarea>
            <button 
                on:click={sendMessage}
                class="px-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                disabled={!newMessage.trim()}
            >
                Send
            </button>
        </div>
    </div>
</div> 