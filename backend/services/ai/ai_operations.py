from openai import OpenAI
import google.generativeai as genai
import asyncio # Import asyncio
from google.generativeai import types # Add types import
# Removed dotenv and os imports as they are handled in clients.py
# Import clients check, not the clients themselves directly if adapters handle them
from .clients import is_gemini_configured # Keep this if needed for checks before adapter call
from backend.services.ai.ai_models import AI_MODELS
from backend.services.ai.ai_extraction import extract_response_data # Keep if needed for common errors

# Import the adapters
from . import deepseek_adapter
from . import gemini_adapter

# Map providers to their adapter modules for dynamic dispatch
PROVIDER_ADAPTERS = {
    'deepseek': deepseek_adapter,
    'gemini': gemini_adapter
}

def get_models():
    ai_models_dict = {}
    try:
        # Use a dictionary comprehension to convert the list to a dict
        ai_models_dict = {
            model_info[1]: {  # Key: model name (index 1)
                'provider': model_info[0],     # Value part 1: provider (index 0)
                'display_name': model_info[2], # Value part 2: display name (index 2)
                'has_thinking': model_info[3]  # Value part 3: thinking capability (index 3)
            }
            # Iterate through the global list
            for model_info in AI_MODELS
        }
    except (NameError, TypeError, IndexError) as e:
        print(f"Warning: Could not process AI_MODELS list. Error: {e}")
        # Optionally, log the error instead of printing
        return {} # Return an empty dictionary on error

    return ai_models_dict

async def generate_response(model: str, messages: list, system_prompt: str = None, temperature: float = None, max_tokens: int = None):
    """
    Asynchronously generates a response from the specified AI model using provider-specific adapters.

    Args:
        model: The name of the model to use (e.g., "deepseek-reasoner", "gemini-2.5-pro-preview-03-25").
        messages: A list of message dictionaries.
        system_prompt: An optional system prompt string.
        temperature: An optional temperature for sampling (float).
        max_tokens: An optional maximum number of tokens to generate (int).

    Returns:
        A dictionary containing the extracted response details (content, tokens, etc.)
        or None if an error occurs.
    """
    all_models = get_models() # This is synchronous, potentially optimize if becomes bottleneck
    if not all_models:
        print("Error: No models available. Check AI_MODELS definition and loading.")
        return None
        
    if model not in all_models:
        print(f"Error: Model '{model}' not found in available models.")
        return None

    model_details = all_models[model]
    provider = model_details['provider']
    has_thinking = model_details['has_thinking']

    # Get the appropriate adapter based on the provider
    adapter = PROVIDER_ADAPTERS.get(provider)

    if not adapter:
        print(f"Error: No adapter found for provider '{provider}'.")
        return None

    # Check if the adapter has an async_generate method
    if not hasattr(adapter, 'async_generate'):
        print(f"Error: Adapter for provider '{provider}' does not support async generation.")
        return None

    # Prepare arguments for the adapter's async_generate function
    adapter_args = {
        "model": model,
        "messages": messages,
        "has_thinking": has_thinking
    }
    if system_prompt is not None:
        adapter_args["system_prompt"] = system_prompt
    if temperature is not None:
        adapter_args["temperature"] = temperature
    if max_tokens is not None:
        adapter_args["max_tokens"] = max_tokens 

    try:
        # Call the adapter's ASYNC generation function
        response_data = await adapter.async_generate(**adapter_args)
        
        if response_data is None:
            # Error details should be logged within the adapter/async_generate wrapper
            print(f"Async adapter for provider '{provider}' failed for model '{model}'.")
            return None
            
        return response_data

    except Exception as e:
        # Catch potential errors during adapter dispatch or unexpected issues
        print(f"Error calling async adapter for provider '{provider}' with model '{model}': {e}")
        return None
