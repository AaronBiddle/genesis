def extract_gemini_data(gemini_response, has_thinking):
    """
    Extracts relevant data from a Gemini GenerateContentResponse object
    into a standardized dictionary format.

    Args:
        gemini_response: The GenerateContentResponse object from the google-generativeai SDK.
        has_thinking (bool): Flag indicating if the model is expected to have reasoning (affects default reasoning fields).

    Returns:
        dict: A dictionary containing the extracted data, matching the keys
              used for the DeepSeek extraction.
    """
    response_data = {}

    # --- Extract Content ---
    # The SDK usually provides a direct .text accessor for simple text responses
    # If the response was blocked or empty, text might be missing or raise an error.
    try:
        # Prefer response.text if available and valid
        response_data['content'] = getattr(gemini_response, 'text', '')
    except (ValueError, AttributeError) as e:
         # Handle cases where .text access fails (e.g., blocked prompt)
         print(f"Warning: Could not directly access response.text: {e}. Trying candidates.")
         response_data['content'] = ""
         # Fallback: Try to get text from the first candidate if content wasn't found via .text
         if not response_data['content'] and hasattr(gemini_response, 'candidates') and gemini_response.candidates:
             first_candidate = gemini_response.candidates[0]
             if hasattr(first_candidate, 'content') and hasattr(first_candidate.content, 'parts') and first_candidate.content.parts:
                 response_data['content'] = getattr(first_candidate.content.parts[0], 'text', '')


    # --- Reasoning Content (Not directly available in Gemini response) ---
    response_data['reasoning_content'] = ""

    # --- Finish Reason ---
    finish_reason_val = 'unknown'
    # Check candidates list exists and is not empty
    if hasattr(gemini_response, 'candidates') and gemini_response.candidates:
         first_candidate = gemini_response.candidates[0]
         # Get finish_reason, default to 'unknown'
         raw_finish_reason = getattr(first_candidate, 'finish_reason', 'unknown')
         # Finish reason can be an enum, convert to its string name
         if hasattr(raw_finish_reason, 'name'):
             finish_reason_val = raw_finish_reason.name
         else:
             finish_reason_val = str(raw_finish_reason) # Fallback to string conversion
    response_data['finish_reason'] = finish_reason_val


    # --- Token Counts (from usage_metadata) ---
    prompt_tokens_val = 0
    completion_tokens_val = 0
    total_tokens_val = 0
    # Check usage_metadata exists
    if hasattr(gemini_response, 'usage_metadata') and gemini_response.usage_metadata:
        usage = gemini_response.usage_metadata
        prompt_tokens_val = getattr(usage, 'prompt_token_count', 0)
        # Gemini uses 'candidates_token_count' for completion tokens
        completion_tokens_val = getattr(usage, 'candidates_token_count', 0)
        total_tokens_val = getattr(usage, 'total_token_count', 0)

    response_data['prompt_tokens'] = prompt_tokens_val
    response_data['completion_tokens'] = completion_tokens_val
    response_data['total_tokens'] = total_tokens_val


    # --- Fields Not Available in Gemini Response ---
    response_data['reasoning_tokens'] = 0  # No direct equivalent
    response_data['cache_hit_tokens'] = 0 # No direct equivalent
    response_data['cache_miss_tokens'] = 0 # No direct equivalent


    # --- Adjust for non-thinking models (consistent with DeepSeek logic) ---
    # Note: These fields are already defaulted above for Gemini,
    # but keeping the check maintains the pattern.
    if not has_thinking:
        response_data['reasoning_content'] = ""
        response_data['reasoning_tokens'] = 0

    return response_data

def extract_response_data(raw_response, provider, has_thinking):
    """
    Extracts relevant data fields from the raw API response object based on the provider.
    (Calls provider-specific extraction functions).

    Args:
        raw_response: The raw response object from the API call (structure varies by provider).
        provider (str): The name of the AI provider ('deepseek' or 'gemini').
        has_thinking (bool): Indicates if the model has thinking/reasoning capabilities.

    Returns:
        A dictionary containing the extracted data (content, tokens, etc.)
        or None if extraction fails.
    """
    if provider == 'deepseek':
        try:
            # Extract data using getattr for safety
            choice = raw_response.choices[0] if raw_response.choices else None
            usage = raw_response.usage

            if not choice or not usage:
                 print(f"Error: Invalid response structure received from DeepSeek API.")
                 return None
            
            # Create the dictionary here for Deepseek
            extracted_data = {}
            extracted_data['content'] = getattr(choice.message, 'content', '')
            extracted_data['reasoning_content'] = getattr(choice.message, 'reasoning_content', '')
            extracted_data['finish_reason'] = getattr(choice, 'finish_reason', 'unknown')

            extracted_data['completion_tokens'] = getattr(usage, 'completion_tokens', 0)
            extracted_data['prompt_tokens'] = getattr(usage, 'prompt_tokens', 0)

            # Safely access nested reasoning_tokens
            reasoning_tokens_val = 0
            if hasattr(usage, 'completion_tokens_details') and usage.completion_tokens_details:
                 reasoning_tokens_val = getattr(usage.completion_tokens_details, 'reasoning_tokens', 0)
            extracted_data['reasoning_tokens'] = reasoning_tokens_val

            extracted_data['total_tokens'] = getattr(usage, 'total_tokens', 0)
            extracted_data['cache_hit_tokens'] = getattr(usage, 'prompt_cache_hit_tokens', 0)
            extracted_data['cache_miss_tokens'] = getattr(usage, 'prompt_cache_miss_tokens', 0)

            # Adjust for non-thinking models
            if not has_thinking:
                extracted_data['reasoning_content'] = ""
                extracted_data['reasoning_tokens'] = 0
            
            return extracted_data
            
        except AttributeError as e:
            print(f"Error extracting DeepSeek data: Missing expected attribute. {e}")
            return None
        except IndexError:
             print(f"Error extracting DeepSeek data: Response structure missing choices.")
             return None
        except Exception as e:
            print(f"An unexpected error occurred during DeepSeek data extraction: {e}")
            return None
            
    elif provider == 'gemini':
        # --- Call the specific Gemini extraction function --- 
        try:
            extracted_data = extract_gemini_data(raw_response, has_thinking)
            return extracted_data
        except Exception as e:
            print(f"An unexpected error occurred during Gemini data extraction: {e}")
            return None

    else:
        print(f"Error: Unknown provider '{provider}' passed to extract_response_data.")
        return None
