import { get, post } from './HttpClient';

// Define the base path for AI operations
const AI_PATH = '/frontend/ai';

// --- Type Definitions (matching backend Pydantic models) ---

// Model for a single message in the chat history
export interface Message {
  role: string; // 'user' or 'assistant'
  content: string;
}

// Request structure for generate_response
export interface GenerateRequest {
  model: string;
  messages: Message[];
  system_prompt?: string | null; // Allow null or undefined
}

// Expected structure of the response from /generate_response
// Adjust based on backend/routers/http_frontend_ai.py > GenerateResponse
export interface GenerateResponse {
  content?: string | null;
  // Include other potential fields if needed (e.g., tokens, finish_reason)
  // thinking_content?: string | null; 
  raw_response?: any; // Keep for debugging as per backend
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
 * Sends a request to generate an AI response.
 * @param {GenerateRequest} requestData - The data for the generation request.
 * @returns {Promise<GenerateResponse>} A promise that resolves to the AI's response.
 */
export async function generateResponse(requestData: GenerateRequest): Promise<GenerateResponse> {
  try {
    const response = await post(`${AI_PATH}/generate_response`, requestData);

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error ${response.status} (${response.statusText}): ${errorText}`);
    }

    const data: GenerateResponse = await response.json();

    // Add basic validation if necessary, e.g., check for response.data existence
    if (!data) {
        console.error('Received empty response from /generate_response');
        throw new Error('Received no data from the AI generation endpoint.');
    }
    return data;
  } catch (error: any) {
    console.error('AIClient: Error generating AI response:', error);
    // Re-throw a more specific error or handle it as needed
    throw new Error(error.message || 'Failed to generate AI response. Is the backend server running?');
  }
} 