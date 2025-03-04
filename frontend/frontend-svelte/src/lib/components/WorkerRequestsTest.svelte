<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { WS_URL } from '$lib/config';
    import { logger } from '$lib/components/LogControlPanel/logger';
    
    let socket: WebSocket | null = null;
    let connected = false;
    let inputText = '';
    let messages: Array<{type: string, content: string}> = [];
    let connectionStatus = 'Disconnected';
    let debugInfo = '';
    
    function connect() {
        if (socket) {
            socket.close();
        }
        
        connectionStatus = 'Connecting...';
        const wsBaseUrl = WS_URL ? WS_URL.split('/ws/')[0] : 'ws://localhost:8000';
        const fullWsUrl = `${wsBaseUrl}/ws/frontend-requests`;
        debugInfo = `Connecting to: ${fullWsUrl} (WS_URL from config: ${WS_URL || 'undefined'})`;

        logger('INFO', 'network', 'WorkerRequestsTest', 'Connecting to:', fullWsUrl);
        
        socket = new WebSocket(fullWsUrl);
        
        socket.onopen = () => {
            connected = true;
            connectionStatus = 'Connected';
            messages = [...messages, { type: 'system', content: 'Connected to server' }];
        };
        
        socket.onmessage = (event) => {
            try {
                const response = JSON.parse(event.data);
                messages = [...messages, { type: 'received', content: JSON.stringify(response, null, 2) }];
            } catch (error) {
                messages = [...messages, { type: 'error', content: `Error parsing response: ${event.data}` }];
            }
        };
        
        socket.onclose = () => {
            connected = false;
            connectionStatus = 'Disconnected';
            messages = [...messages, { type: 'system', content: 'Disconnected from server' }];
        };
        
        socket.onerror = (error) => {
            connectionStatus = 'Error';
            messages = [...messages, { type: 'error', content: `WebSocket error: ${error}` }];
            logger('ERROR', 'network', 'WorkerRequestsTest', 'WebSocket error:', error);
        };
    }
    
    function disconnect() {
        if (socket) {
            socket.close();
            socket = null;
        }
    }
    
    function sendMessage() {
        if (socket && connected && inputText.trim()) {
            const message = { text: inputText.trim() };
            socket.send(JSON.stringify(message));
            messages = [...messages, { type: 'sent', content: JSON.stringify(message, null, 2) }];
            inputText = '';
        }
    }
    
    onMount(() => {
        connect();
    });
    
    onDestroy(() => {
        disconnect();
    });
</script>

<div class="p-4 max-w-2xl mx-auto">
    <h2 class="text-xl font-bold mb-4">WebSocket Worker Requests Test</h2>
    
    <div class="mb-4">
        <div class="flex items-center mb-2">
            <div class="w-3 h-3 rounded-full mr-2" class:bg-green-500={connected} class:bg-red-500={!connected}></div>
            <span class="text-sm font-medium">{connectionStatus}</span>
        </div>
        
        {#if debugInfo}
            <div class="text-xs text-gray-600 mb-2 p-2 bg-gray-100 rounded">
                {debugInfo}
            </div>
        {/if}
        
        <div class="flex space-x-2">
            <button 
                on:click={connect}
                disabled={connected}
                class="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Connect
            </button>
            
            <button 
                on:click={disconnect}
                disabled={!connected}
                class="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Disconnect
            </button>
        </div>
    </div>
    
    <div class="mb-4">
        <div class="flex space-x-2">
            <input 
                type="text" 
                bind:value={inputText} 
                placeholder="Enter text to send"
                class="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                on:keydown={(e) => e.key === 'Enter' && sendMessage()}
                disabled={!connected}
            />
            
            <button 
                on:click={sendMessage}
                disabled={!connected || !inputText.trim()}
                class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Send
            </button>
        </div>
    </div>
    
    <div class="border rounded-md p-2 bg-gray-50 h-64 overflow-y-auto">
        {#if messages.length === 0}
            <p class="text-gray-400 text-center py-4">No messages yet</p>
        {:else}
            <div class="space-y-2">
                {#each messages as message}
                    <div class="p-2 rounded-md text-sm" 
                        class:bg-blue-100={message.type === 'sent'}
                        class:bg-green-100={message.type === 'received'}
                        class:bg-gray-200={message.type === 'system'}
                        class:bg-red-100={message.type === 'error'}
                    >
                        <div class="font-semibold mb-1">
                            {#if message.type === 'sent'}
                                → Sent:
                            {:else if message.type === 'received'}
                                ← Received:
                            {:else if message.type === 'system'}
                                System:
                            {:else if message.type === 'error'}
                                Error:
                            {/if}
                        </div>
                        <pre class="whitespace-pre-wrap break-words">{message.content}</pre>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
    
    <p class="text-gray-600 mt-4 text-sm">
        This component connects to the WebSocket endpoint at <code>{WS_URL}/ws/worker-requests</code> and allows you to send messages with a "text" field.
    </p>
</div> 