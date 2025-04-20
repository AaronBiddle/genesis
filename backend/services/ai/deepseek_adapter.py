# backend/services/ai/deepseek_adapter.py
from .clients import deepseek_client
from .ai_extraction import extract_response_data # Assuming ai_extraction is in the same dir

def sync_generate(model, messages, has_thinking, **kwargs):
    if not deepseek_client:
        # Consider raising a more specific exception or handling this upstream
        print("Error: DeepSeek client is not initialized. Cannot generate response.")
        return None # Or raise an exception

    # Prepare DeepSeek API call arguments
    # System prompt is often handled differently, check if it's in kwargs
    final_messages_deepseek = []
    system_prompt = kwargs.pop('system_prompt', None) # Remove system_prompt from kwargs if present
    if system_prompt:
        final_messages_deepseek.append({"role": "system", "content": system_prompt})
    final_messages_deepseek.extend(messages)

    deepseek_args = {
        "model": model,
        "messages": final_messages_deepseek,
        **kwargs # Pass remaining kwargs like temperature, max_tokens
    }

    try:
        resp = deepseek_client.chat.completions.create(**deepseek_args)
        # Pass has_thinking to the extractor
        response_data = extract_response_data(resp, provider="deepseek", has_thinking=has_thinking)
        if response_data is None:
            print(f"Failed to extract data for DeepSeek model {model}.")
            return None
        return response_data
    except Exception as e:
        print(f"Error during DeepSeek API call for model {model}: {e}")
        return None 