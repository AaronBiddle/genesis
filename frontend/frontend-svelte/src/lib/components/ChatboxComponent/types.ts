// Define shared types for the chat component

export interface Message {
    id: number;
    text: string;
    sender: 'user' | 'assistant';
    timestamp: Date;
    renderMarkdown?: boolean; // optional flag to enable markdown rendering (default true)
    reasoning?: string; // Optional field to store the model's reasoning process
    showReasoning?: boolean; // Whether to display the reasoning (default false)
}

export interface ChatSettings {
    temperature: number;
    systemPrompt: string;
    modelId: string; // Added model selection
}

export interface WebSocketMessage {
    sessionId: string;  // Added to identify which chat session this message belongs to
    type?: 'message' | 'token' | 'error' | 'status';  // Added to identify message type
    token?: string;
    error?: string;
    details?: string;
    done?: boolean;
    reasoning?: string; // Added to support reasoning content
}

export interface WebSocketPayload {
    sessionId: string;
    type: 'message';
    payload: {
        prompt: string;
        history: { 
            role: string; 
            content: string;
        }[];
        system_prompt: string;
        temperature: number;
        model_id: string; // Added model selection
    };
} 