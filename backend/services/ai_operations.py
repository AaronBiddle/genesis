from openai import OpenAI
import google.generativeai as genai
from google.generativeai import types # Add types import
from dotenv import load_dotenv
import os
from backend.services.ai_models import AI_MODELS


from backend.services.ai_extraction import extract_response_data # Import the new function

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

# Configure Gemini using genai.configure (based on working example)
if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        print("Gemini API configured successfully via genai.configure().")
    except Exception as e:
        print(f"Error configuring Gemini API via genai.configure(): {e}")
else:
    print("Warning: GEMINI_API_KEY not found in environment variables. Gemini models will not be available.")

def generate_response(model: str, messages: list, system_prompt: str = None, temperature: float = None, max_tokens: int = None):
    """
    Generates a response from the specified AI model.

    Args:
        model: The name of the model to use (e.g., "deepseek-reasoner", "gemini-2.5-pro-preview-03-25").
        messages: A list of message dictionaries.
        system_prompt: An optional system prompt string.
        temperature: An optional temperature for sampling (float).
        max_tokens: An optional maximum number of tokens to generate (int).

    Returns:
        A dictionary containing the extracted response details (content, tokens, etc.)
        or None if an error occurs or extraction is not yet implemented (Gemini).
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

    try:
        if provider == 'deepseek':
            if not deepseek_client:
                print("Error: DeepSeek client is not initialized (check API key).")
                return None
            # Prepare messages specifically for DeepSeek (OpenAI format)
            final_messages_deepseek = []
            if system_prompt:
                final_messages_deepseek.append({"role": "system", "content": system_prompt})
            final_messages_deepseek.extend(messages)
            
            # Prepare DeepSeek API call arguments
            deepseek_args = {
                "model": model,
                "messages": final_messages_deepseek
            }
            if temperature is not None:
                 deepseek_args["temperature"] = temperature
            if max_tokens is not None:
                 deepseek_args["max_tokens"] = max_tokens # Add max_tokens for DeepSeek

            response = deepseek_client.chat.completions.create(**deepseek_args)
            
            # Call the extraction function
            response_data = extract_response_data(response, provider, has_thinking)
            
            # The extractor returns None on failure
            if response_data is None:
                print(f"Failed to extract data for DeepSeek model {model}.")
                return None
                
        elif provider == 'gemini':
            # Check if Gemini was configured successfully
            if not GEMINI_API_KEY: # Basic check, configure might have failed
                 print("Error: Gemini API key not found or configuration failed. Cannot call Gemini model.")
                 return None

            try:
                # Instantiate the client
                gemini_client = genai.Client() # Use the client

                # --- Convert messages to the format expected by generate_content ---
                # Required format: [{'role': 'user'/'model', 'parts': [{'text': '...'}]}]
                converted_contents = []
                if not messages or not isinstance(messages, list):
                     print("Error: Invalid or empty messages format for Gemini call.")
                     return None

                for msg in messages:
                    role = msg.get('role')
                    content = msg.get('content')
                    if not role or not content:
                        print(f"Warning: Skipping invalid message format: {msg}")
                        continue
                    # Adjust role if necessary (e.g., 'assistant' to 'model')
                    if role == 'assistant':
                        role = 'model'
                    converted_contents.append({'role': role, 'parts': [{'text': content}]})

                if not converted_contents:
                    print("Error: No valid messages found after conversion for Gemini call.")
                    return None

                # --- Prepare the generation configuration --- 
                generation_config_args = {}
                if system_prompt:
                    generation_config_args["system_instruction"] = system_prompt
                if temperature is not None:
                    generation_config_args["temperature"] = temperature
                if max_tokens is not None:
                    generation_config_args["max_output_tokens"] = max_tokens # Add max_output_tokens for Gemini
                
                generation_config = types.GenerateContentConfig(**generation_config_args)
                # Add other config like ... if needed outside the constructor

                # Generate content using the client, converted contents, and config
                gemini_response = gemini_client.models.generate_content(
                    model=model, 
                    contents=converted_contents, 
                    generation_config=generation_config # Pass the config
                )

                # Call the extraction function (which currently prints raw response and returns None)
                response_data = extract_response_data(gemini_response, provider, has_thinking)
                
                # Since extractor returns None for Gemini currently, we return None here as well
                # This maintains the previous behavior of stopping after printing raw Gemini response.
                if response_data is None: 
                    print(f"(Terminating call for Gemini model '{model}' after handling in extractor)")
                    return None
                
            except Exception as e:
                print(f"Error during Gemini API call for model {model}: {e}")
                # You might want to print more details from the exception 'e' for debugging
                return None

        else:
            print(f"Error: Unknown provider '{provider}' for model '{model}'.")
            return None

    except Exception as e:
        # This outer try-except catches errors before provider check or client issues
        print(f"Error generating response for model {model}: {e}")
        return None

    # Return the dictionary populated by the extractor function
    return response_data

# Example usage removed - moved to test.py

