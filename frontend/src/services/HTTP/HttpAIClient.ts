import { get, post } from './HttpClient';

// Define the base path for AI operations
const AI_PATH = '/frontend/ai';

// --- Type Definitions (matching backend Pydantic models) ---

// Model for a single message in the chat history
export interface Message {
  role: string; // 'user' or 'assistant'
  content: string;
}

// Request structure for generate_response (now targeting /chat)
// Renamed from GenerateRequest
export interface ChatRequestData {
  model: string;
  messages: Message[];
  system_prompt?: string | null; // Kept here for function input, but not sent directly
}

// Expected structure of the response from /chat
// Renamed from GenerateResponse
export interface ChatReply {
  text: string;
  meta: Record<string, any>; // Or just `any`
}

// Expected structure for a single model's details from /get_models
export interface ModelDetails {
  provider: string;
  name: string;
  display_name: string;
  supports_thinking: boolean; // Renamed from has_thinking
  // Add any other relevant fields returned by the backend
}

// Expected structure of the response from /get_models
export type GetModelsResponse = ModelDetails[]; // Changed to an array of ModelDetails

// --- Service Functions ---

/**
 * Fetches the available AI models from the backend.
 * @returns {Promise<GetModelsResponse>} A promise that resolves to the list of models.
 */
export async function getModels(): Promise<GetModelsResponse> {
  try {
    const response = await get(`${AI_PATH}/models`);

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error ${response.status} (${response.statusText}): ${errorText}`);
    }

    // The backend returns an array directly
    const data: GetModelsResponse = await response.json();

    // Basic validation: Check if the response is an array
    if (!Array.isArray(data)) {
        console.error('Invalid response structure from /models: Expected an array, received:', data);
        throw new Error('Received invalid data structure for AI models.');
    }
    // Optional: Add validation for array elements if needed
    // data.forEach(item => { /* validate item properties */ });

    return data;
  } catch (error: any) {
    console.error('AIClient: Error fetching AI models:', error);
    // Re-throw a more specific error or handle it as needed
    throw new Error(error.message || 'Failed to fetch AI models. Is the backend server running?');
  }
}

/**
 * Sends a request to generate an AI response via the /chat endpoint.
 * @param {ChatRequestData} requestData - The data for the generation request.
 * @returns {Promise<ChatReply>} A promise that resolves to the AI's response.
 */
export async function generateResponse(requestData: ChatRequestData): Promise<ChatReply> {
  try {
    // Prepare messages, potentially adding system prompt
    const messagesToSend: Message[] = [
        ...(requestData.system_prompt ? [{ role: 'system', content: requestData.system_prompt }] : []),
        ...requestData.messages
    ];

    // Prepare payload for the /chat endpoint
    const payload = {
        model: requestData.model,
        messages: messagesToSend,
        stream: false // Assuming non-streamed response for this HTTP client function
        // Add temperature etc. here if needed in the future
    };

    // Use the /chat endpoint
    const response = await post(`${AI_PATH}/chat`, payload);

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error ${response.status} (${response.statusText}): ${errorText}`);
    }

    const data: ChatReply = await response.json();

    // Basic validation for the new structure
    if (!data || typeof data.text !== 'string' || typeof data.meta !== 'object') {
        console.error('Received invalid response structure from /chat:', data);
        throw new Error('Received invalid data structure from the AI chat endpoint.');
    }

    return data;
  } catch (error: any) {
    console.error('AIClient: Error generating AI response via /chat:', error);
    // Re-throw a more specific error or handle it as needed
    throw new Error(error.message || 'Failed to generate AI response. Is the backend server running?');
  }
} 