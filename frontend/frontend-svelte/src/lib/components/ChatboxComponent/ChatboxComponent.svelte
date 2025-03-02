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

    // Add state for settings view
    let showSettings = false;
    
    // Toggle between chat and settings views
    function toggleSettings() {
        showSettings = !showSettings;
    }

    // New function to toggle markdown rendering for a system message
    function toggleMarkdown(id: number) {
        messages = messages.map(msg => {
            if (msg.id === id) {
                return { ...msg, renderMarkdown: msg.renderMarkdown === false ? true : false };
            }
            return msg;
        });
    }

    // Default settings
    let defaultMarkdown = true;
    let chatTheme = 'light';

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

<!-- Main container -->
<div class="flex flex-col h-full">
    <div class="flex flex-col h-full min-h-0 relative overflow-hidden p-1" style="height: 100%;">
        <!-- Header with title, settings button, and connection indicator -->
        <div class="flex justify-between items-center mb-1">
            <h2 class="text-xl font-bold">{showSettings ? 'Settings' : 'Chatbox'}</h2>
            <div class="flex items-center">
                <button 
                    aria-label={showSettings ? "Back to Chat" : "Settings"}
                    on:click={toggleSettings} 
                    class="text-gray-600 hover:text-gray-800 p-1 rounded-full hover:bg-gray-200 mr-2"
                    title={showSettings ? "Back to Chat" : "Settings"}
                >
                    {#if showSettings}
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
                <!-- Connection indicator in the normal flow -->
                {#if wsConnected}
                    <span class="inline-block w-3 h-3 rounded-full bg-green-500" title="Connected"></span>
                {:else}
                    <button 
                        aria-label="Reconnect" 
                        on:click={connect} 
                        class="inline-block w-3 h-3 rounded-full bg-red-500 cursor-pointer" 
                        title="Disconnected - Click to reconnect"
                    ></button>
                {/if}
            </div>
        </div>

        {#if showSettings}
            <!-- Settings View -->
            <div class="flex-1 p-3 border border-gray-200 rounded-lg overflow-y-auto">
                <div class="space-y-6">
                    <div>
                        <h3 class="text-lg font-medium mb-2">Chat Preferences</h3>
                        <div class="space-y-3 pl-2">
                            <div class="flex items-center justify-between">
                                <label for="markdown-default" class="text-sm font-medium">Default to Markdown</label>
                                <input type="checkbox" id="markdown-default" bind:checked={defaultMarkdown}>
                            </div>
                            
                            <div class="flex items-center justify-between">
                                <label for="chat-theme" class="text-sm font-medium">Chat Theme</label>
                                <select id="chat-theme" bind:value={chatTheme} class="border border-gray-300 rounded px-2 py-1">
                                    <option value="light">Light</option>
                                    <option value="dark">Dark</option>
                                    <option value="system">System Default</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <h3 class="text-lg font-medium mb-2">Connection</h3>
                        <div class="space-y-3 pl-2">
                            <div class="flex items-center justify-between">
                                <span class="text-sm font-medium">Connection Status</span>
                                <span class="flex items-center">
                                    {#if wsConnected}
                                        <span class="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                                        <span class="text-sm">Connected</span>
                                    {:else}
                                        <span class="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                                        <span class="text-sm">Disconnected</span>
                                    {/if}
                                </span>
                            </div>
                            
                            <div class="flex justify-end">
                                <button 
                                    on:click={connect}
                                    class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                                >
                                    Reconnect
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <h3 class="text-lg font-medium mb-2">About</h3>
                        <div class="space-y-2 pl-2 text-sm">
                            <p>Chat Version: 1.0.0</p>
                            <p>© 2023 Your Company</p>
                        </div>
                    </div>
                </div>
            </div>
        {:else}
            <!-- Chat View -->
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
        {/if}
    </div>
</div> 