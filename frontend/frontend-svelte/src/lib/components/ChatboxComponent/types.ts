// Define shared types for the chat component

export interface Message {
    id: number;
    text: string;
    sender: 'user' | 'system';
    timestamp: Date;
    renderMarkdown?: boolean; // optional flag to enable markdown rendering (default true)
}

export interface ChatSettings {
    temperature: number;
    systemPrompt: string;
}

export interface WebSocketMessage {
    sessionId: string;  // Added to identify which chat session this message belongs to
    type?: 'message' | 'token' | 'error' | 'status';  // Added to identify message type
    token?: string;
    error?: string;
    details?: string;
    done?: boolean;
}

export interface WebSocketPayload {
    sessionId: string;
    type: 'message';
    payload: {
        prompt: string;
        history: { role: string; content: string }[];
        system_prompt: string;
        temperature: number;
    };
} 