from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

# Import the AI operations service
from backend.services import ai_operations

router = APIRouter()

# --- Pydantic Models ---

# Model for a single message in the chat history
class Message(BaseModel):
    role: str = Field(..., description="Role of the message sender (e.g., 'user', 'assistant')")
    content: str = Field(..., description="Content of the message")

# Request model for the generate_response endpoint
class GenerateRequest(BaseModel):
    model: str = Field(..., description="Name of the AI model to use")
    messages: List[Message] = Field(..., description="List of message objects representing the conversation history")
    system_prompt: Optional[str] = Field(None, description="Optional system prompt to guide the AI")
    temperature: Optional[float] = Field(None, description="Optional temperature for sampling", ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(None, description="Optional maximum number of tokens to generate", gt=0)

# Response model for generate_response (assuming ai_operations.generate_response returns a dict)
# Adjust this based on the actual structure returned by extract_response_data
class GenerateResponse(BaseModel):
    # Example fields - replace with actual fields from ai_operations response
    content: Optional[str] = Field(None, description="The generated response content")
    # Add other fields like token counts, finish reason, etc., if available
    # Example:
    # prompt_tokens: Optional[int] = None
    # completion_tokens: Optional[int] = None
    # total_tokens: Optional[int] = None
    # finish_reason: Optional[str] = None
    # thinking_content: Optional[str] = Field(None, description="Content generated during 'thinking' phase if applicable")
    raw_response: Optional[Any] = Field(None, description="The raw response object from the provider for debugging") # Or specific type

# Response model for get_models (maps model name to details)
class GetModelsResponse(BaseModel):
    models: Dict[str, Dict[str, Any]] = Field(..., description="Dictionary mapping model names to their details (provider, display_name, has_thinking)")


# --- API Endpoints ---

@router.get("/get_models", 
            response_model=GetModelsResponse,
            summary="Get Available AI Models",
            description="Retrieves a list of currently available AI models and their details.")
async def get_available_models():
    """
    Fetches the dictionary of available AI models from the ai_operations service.
    """
    try:
        models = ai_operations.get_models()
        if not models:
            # Handle case where get_models returns an empty dict or None
             raise HTTPException(status_code=404, detail="No AI models found or service unavailable.")
        return GetModelsResponse(models=models)
    except Exception as e:
        # Catch potential errors during model fetching
        print(f"Error fetching models: {e}") # Log the error
        raise HTTPException(status_code=500, detail="Internal server error fetching AI models.")


@router.post("/generate_response", 
             response_model=GenerateResponse, # Or adjust if ai_operations returns something different
             summary="Generate AI Response",
             description="Sends a prompt and conversation history to a specified AI model and receives a generated response.")
async def generate_ai_response(request: GenerateRequest = Body(...)):
    """
    Generates a response from the specified AI model using the provided messages and optional system prompt.
    """
    try:
        # Convert Pydantic Message models to simple dicts expected by ai_operations
        messages_dict_list = [msg.model_dump() for msg in request.messages]

        response_data = ai_operations.generate_response(
            model=request.model,
            messages=messages_dict_list,
            system_prompt=request.system_prompt,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )

        if response_data is None:
            # Handle cases where generate_response fails (e.g., API error, model not found, extraction failed)
            # ai_operations should print specific errors, here we return a generic server error
            # or a more specific one if possible based on logs or potential return values
             raise HTTPException(status_code=500, detail=f"Failed to generate response from model '{request.model}'. Check server logs for details.")

        # Assuming response_data is a dictionary matching GenerateResponse structure
        # If the structure differs, you'll need to adapt the GenerateResponse model
        # or transform response_data here.
        # For now, directly pass it, relying on Pydantic validation.
        # We include the raw_response for debugging as the extractor for Gemini isn't fully done.
        return GenerateResponse(**response_data, raw_response=response_data) # Pass raw data if needed

    except HTTPException as http_exc:
        # Re-raise HTTPExceptions directly
        raise http_exc
    except Exception as e:
        # Catch unexpected errors during generation
        print(f"Error generating response: {e}") # Log the error
        raise HTTPException(status_code=500, detail="Internal server error during AI response generation.")
