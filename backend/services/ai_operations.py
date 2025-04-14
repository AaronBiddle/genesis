from openai import OpenAI
from dotenv import load_dotenv
import os
from ai_models import AI_MODELS
import json # Added for pretty printing the output dictionary

# Load environment variables
load_dotenv()

# Get API keys from environment variables
DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

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
        # Handle cases where AI_MODELS might not be defined or has wrong format
        print(f"Warning: Could not process AI_MODELS list. Error: {e}")
        # Optionally, log the error instead of printing
        return {} # Return an empty dictionary on error

    return ai_models_dict

# Initialize clients (only DeepSeek for now)
# Ensure API key is loaded before initializing
if DEEPSEEK_API_KEY:
    deepseek_client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url="https://api.deepseek.com")
else:
    print("Warning: DEEPSEEK_API_KEY not found in environment variables. DeepSeek client not initialized.")
    deepseek_client = None

# Placeholder for Gemini client initialization
# gemini_client = ...

def generate_response(model: str, messages: list, system_prompt: str = None):
    """
    Generates a response from the specified AI model.

    Args:
        model: The name of the model to use (e.g., "deepseek-reasoner").
        messages: A list of message dictionaries.
        system_prompt: An optional system prompt string.

    Returns:
        A dictionary containing the response details (content, tokens, etc.)
        or None if an error occurs.
    """
    all_models = get_models()
    if not all_models:
        print("Error: No models available. Check AI_MODELS definition and loading.")
        return None
        
    if model not in all_models:
        print(f"Error: Model '{model}' not found in available models.")
        return None

    model_details = all_models[model]
    provider = model_details['provider']
    has_thinking = model_details['has_thinking']

    # Prepare messages with optional system prompt
    final_messages = []
    if system_prompt:
        final_messages.append({"role": "system", "content": system_prompt})
    final_messages.extend(messages)

    response_data = {}

    try:
        if provider == 'deepseek':
            if not deepseek_client:
                print("Error: DeepSeek client is not initialized (check API key).")
                return None
            response = deepseek_client.chat.completions.create(
                model=model,
                messages=final_messages
            )

            # Extract data using getattr for safety
            choice = response.choices[0] if response.choices else None
            usage = response.usage

            if not choice or not usage:
                 print(f"Error: Invalid response structure received from DeepSeek API for model {model}.")
                 return None

            response_data['content'] = getattr(choice.message, 'content', '')
            response_data['reasoning_content'] = getattr(choice.message, 'reasoning_content', '')
            response_data['finish_reason'] = getattr(choice, 'finish_reason', 'unknown')

            response_data['completion_tokens'] = getattr(usage, 'completion_tokens', 0)
            response_data['prompt_tokens'] = getattr(usage, 'prompt_tokens', 0)

            # Safely access nested reasoning_tokens
            reasoning_tokens_val = 0
            if hasattr(usage, 'completion_tokens_details') and usage.completion_tokens_details:
                 reasoning_tokens_val = getattr(usage.completion_tokens_details, 'reasoning_tokens', 0)
            response_data['reasoning_tokens'] = reasoning_tokens_val

            response_data['total_tokens'] = getattr(usage, 'total_tokens', 0)
            response_data['cache_hit_tokens'] = getattr(usage, 'prompt_cache_hit_tokens', 0)
            response_data['cache_miss_tokens'] = getattr(usage, 'prompt_cache_miss_tokens', 0)

            # Adjust for non-thinking models
            if not has_thinking:
                response_data['reasoning_content'] = ""
                response_data['reasoning_tokens'] = 0

        elif provider == 'gemini':
            # Placeholder for Gemini client call
            print(f"Error: Gemini provider ('{model}') not yet implemented.")
            return None
        else:
            print(f"Error: Unknown provider '{provider}' for model '{model}'.")
            return None

    except Exception as e:
        print(f"Error during API call for model {model}: {e}")
        return None

    return response_data

# Example usage removed - moved to test.py

