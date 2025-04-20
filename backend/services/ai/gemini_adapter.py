# backend/services/ai/gemini_adapter.py
import google.generativeai as genai
from .clients import is_gemini_configured # Import the configuration check
from .ai_extraction import extract_response_data # Assuming ai_extraction is in the same dir

def convert_to_gemini_format(messages, system_prompt=None):
    """Converts standard message list and optional system prompt to Gemini format."""
    converted_contents = []
    if not messages or not isinstance(messages, list):
        print("Error: Invalid or empty messages format for Gemini conversion.")
        return None, None # Return None for both contents and system instruction

    for msg in messages:
        role = msg.get('role')
        content = msg.get('content')
        if not role or not content:
            print(f"Warning: Skipping invalid message format during conversion: {msg}")
            continue
        # Adjust role if necessary (e.g., 'assistant' to 'model')
        if role == 'assistant':
            role = 'model'
        elif role == 'system': # Skip system messages here, handle separately
            print("Warning: System messages in the main list are ignored for Gemini, use the 'system_prompt' argument.")
            continue
        converted_contents.append({'role': role, 'parts': [{'text': content}]})

    if not converted_contents:
        print("Error: No valid messages found after conversion for Gemini call.")
        return None, None

    # Handle system prompt separately for generation_config
    system_instruction = None
    if system_prompt:
        system_instruction = {'parts': [{'text': system_prompt}]}

    return converted_contents, system_instruction

def sync_generate(model, messages, has_thinking, **kwargs):
    if not is_gemini_configured():
        print("Error: Gemini API is not configured. Cannot generate response.")
        return None # Or raise

    system_prompt = kwargs.pop('system_prompt', None)
    temperature = kwargs.pop('temperature', None)
    max_tokens = kwargs.pop('max_tokens', None)

    converted_contents, system_instruction = convert_to_gemini_format(messages, system_prompt)

    if converted_contents is None:
        # Error already printed in convert_to_gemini_format
        return None

    try:
        model_instance = genai.GenerativeModel(model_name=model)

        # --- Prepare the generation configuration --- 
        generation_config_args = {}
        if system_instruction:
             generation_config_args["system_instruction"] = system_instruction
        if temperature is not None:
            generation_config_args["temperature"] = temperature
        if max_tokens is not None:
            generation_config_args["max_output_tokens"] = max_tokens
        
        # Pass any other relevant kwargs directly if needed, filtering known ones
        # generation_config_args.update(kwargs) # Be cautious with unknown kwargs

        gemini_response = model_instance.generate_content(
            contents=converted_contents,
            generation_config=genai.types.GenerationConfig(**generation_config_args) # Use GenerationConfig object
        )

        response_data = extract_response_data(gemini_response, provider="gemini", has_thinking=has_thinking)

        if response_data is None:
             print(f"(Terminating call for Gemini model '{model}' after handling in extractor)")
             return None
        return response_data

    except Exception as e:
        print(f"Error during Gemini API call for model {model}: {e}")
        return None 