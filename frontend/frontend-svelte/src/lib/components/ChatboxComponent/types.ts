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
    token?: string;
    error?: string;
    details?: string;
    done?: boolean;
} 