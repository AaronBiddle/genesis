# backend/services/ai/deepseek_adapter.py
import asyncio # Import asyncio
import datetime # Import datetime for logging timestamps
from .clients import deepseek_client
from .ai_extraction import extract_response_data # Assuming ai_extraction is in the same dir

def sync_generate(model, messages, has_thinking, **kwargs):
    start_time = datetime.datetime.now()
    print(f"[{start_time.isoformat()}] DeepSeek sync_generate started for model {model}")

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
        api_call_start = datetime.datetime.now()
        print(f"[{api_call_start.isoformat()}] DeepSeek calling API for model {model}...")
        resp = deepseek_client.chat.completions.create(**deepseek_args)
        api_call_end = datetime.datetime.now()
        print(f"[{api_call_end.isoformat()}] DeepSeek API call finished for model {model}. Duration: {api_call_end - api_call_start}")

        # Pass has_thinking to the extractor
        response_data = extract_response_data(resp, provider="deepseek", has_thinking=has_thinking)
        if response_data is None:
            print(f"Failed to extract data for DeepSeek model {model}.")
            return None
        
        end_time = datetime.datetime.now()
        print(f"[{end_time.isoformat()}] DeepSeek sync_generate finished for model {model}. Total duration: {end_time - start_time}")
        return response_data
    except Exception as e:
        error_time = datetime.datetime.now()
        print(f"[{error_time.isoformat()}] Error during DeepSeek API call for model {model}: {e}")
        print(f"[{error_time.isoformat()}] DeepSeek sync_generate finished with error for model {model}. Total duration: {error_time - start_time}")
        return None

async def async_generate(model, messages, has_thinking, **kwargs):
    """Asynchronously generates response by running sync_generate in a separate thread."""
    try:
        # Use asyncio.to_thread to run the synchronous function
        return await asyncio.to_thread(
            sync_generate, model, messages, has_thinking, **kwargs
        )
    except Exception as e:
        # Handle exceptions raised from the thread or during scheduling
        print(f"Error in async_generate (DeepSeek) for model {model}: {e}")
        return None 