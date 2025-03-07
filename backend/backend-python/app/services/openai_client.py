import os
import asyncio
import sys
from typing import AsyncGenerator, Any, Dict, Optional
from openai import OpenAI
from dotenv import load_dotenv, find_dotenv
from utils.logging import LogLevel, log
from utils.config import get_model_api_config
import json
import time

# Constants for reasoning tags
REASONING_START_TAG = "\n### Reasoning:\n"
REASONING_END_TAG = "\n### Answer:\n"

# Load environment variables from .env file.
dotenv_path = find_dotenv()
print(f"dotenv_path: {dotenv_path}")
load_dotenv(dotenv_path)

try:
    # Get default model configuration
    DEFAULT_MODEL_CONFIG = get_model_api_config()
    DEFAULT_MODEL_ID = DEFAULT_MODEL_CONFIG.get("model_id")
    DEFAULT_TEMPERATURE = DEFAULT_MODEL_CONFIG.get("temperature_default", 0.7)

    # Initialize the client with DeepSeek credentials from config
    client = OpenAI(
        api_key=DEFAULT_MODEL_CONFIG.get("api_key"),
        base_url=DEFAULT_MODEL_CONFIG.get("base_url")
    )
except Exception as e:
    log(LogLevel.ERROR, f"Fatal error initializing OpenAI client: {str(e)}")
    print(f"Fatal error: {str(e)}", file=sys.stderr)
    # Exit the application with an error code
    sys.exit(1)

DEBUG_OPENAI = False

def get_client_for_model(model_id: Optional[str] = None) -> OpenAI:
    """
    Get an OpenAI client configured for the specified model.
    If model_id is not provided, uses the default model.
    """
    if model_id is None:
        return client
    
    try:    
        model_config = get_model_api_config(model_id)
        return OpenAI(
            api_key=model_config.get("api_key"),
            base_url=model_config.get("base_url")
        )
    except Exception as e:
        log(LogLevel.ERROR, f"Error getting client for model {model_id}: {str(e)}")
        raise

def chat_completion_sync(prompt: str, model_id: Optional[str] = None, temperature: Optional[float] = None) -> str:
    """
    Synchronously gets a chat completion using the API.
    """
    try:
        model_config = get_model_api_config(model_id)
        model_id = model_config.get("model_id")
        temp = temperature if temperature is not None else model_config.get("temperature_default", DEFAULT_TEMPERATURE)
    
        client_instance = get_client_for_model(model_id)
        
        response = client_instance.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt},
            ],
            model=model_id,
            temperature=temp
        )
        
        # Check if this is a reasoning model with reasoning_content
        if hasattr(response.choices[0].message, 'reasoning_content') and response.choices[0].message.reasoning_content:
            # Combine reasoning content (wrapped in markdown formatting) with the regular content
            reasoning = response.choices[0].message.reasoning_content
            
            # Format the reasoning content with blockquote markers for each line
            formatted_reasoning = ""
            for line in reasoning.split('\n'):
                formatted_reasoning += f"> {line}\n"
            
            content = response.choices[0].message.content.strip()
            return f"{REASONING_START_TAG}{formatted_reasoning.strip()}{REASONING_END_TAG}\n{content}"
        else:
            # Regular model, just return the content
            return response.choices[0].message.content.strip()
    except Exception as e:
        log(LogLevel.ERROR, f"Error in chat_completion_sync: {str(e)}")
        raise

async def get_chat_response(prompt: str, model_id: Optional[str] = None, temperature: Optional[float] = None) -> str:
    """
    Asynchronously wraps the synchronous chat completion call.
    """
    try:
        loop = asyncio.get_running_loop()
        answer = await loop.run_in_executor(
            None,
            lambda: chat_completion_sync(prompt, model_id, temperature)
        )
        return answer
    except Exception as e:
        log(LogLevel.ERROR, f"Error in get_chat_response: {str(e)}")
        raise

def stream_chat_completion_sync(prompt: str, model_id: Optional[str] = None, temperature: Optional[float] = None):
    """
    Synchronously initiates a streaming chat completion request.
    Returns the raw stream response from the API.
    This function doesn't process the stream - it just returns the stream object.
    The caller is responsible for iterating through the stream and handling reasoning_content.
    """
    try:
        model_config = get_model_api_config(model_id)
        model_id = model_config.get("model_id")
        temp = temperature if temperature is not None else model_config.get("temperature_default", DEFAULT_TEMPERATURE)
    
        client_instance = get_client_for_model(model_id)
        
        return client_instance.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt},
            ],
            model=model_id,
            temperature=temp,
            stream=True  # Enable streaming
        )
    except Exception as e:
        log(LogLevel.ERROR, f"Error in stream_chat_completion_sync: {str(e)}")
        raise

async def stream_chat_response(prompt: str, history: list = None, temperature: Optional[float] = None, model_id: Optional[str] = None) -> AsyncGenerator[tuple[str, Any], None]:
    """
    Asynchronously streams chat completion using the API.
    Returns tuples of (content_chunk, usage_stats).
    """
    try:
        # Get model configuration
        model_config = get_model_api_config(model_id)
        model_id = model_config.get("model_id")
        temp = temperature if temperature is not None else model_config.get("temperature_default", DEFAULT_TEMPERATURE)
        
        client_instance = get_client_for_model(model_id)
        
        messages = []
        if history:
            messages.extend(history)
        else:
            messages.append({"role": "system", "content": "You are a helpful assistant."})
            
        messages.append({"role": "user", "content": prompt})

        # Create truncated version of messages for logging
        debug_messages = [
            {
                "role": msg["role"],
                "content": msg["content"] if msg["role"] == "system" else (msg["content"][:10] + "...")
            } for msg in messages
        ]
        log(LogLevel.DEBUGGING, f"Sending messages to {model_id} (temp={temp}): {json.dumps(debug_messages)}")
        
        # Create the completion in a separate thread to avoid blocking
        loop = asyncio.get_running_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client_instance.chat.completions.create(
                messages=messages,
                model=model_id,
                temperature=temp,
                stream=True
            )
        )

        # Process chunks as they arrive
        async def process_stream():
            # Track if we're currently in a reasoning section
            in_reasoning_section = False
            reasoning_started = False
            content_started = False
            last_char_was_newline = False
            
            for chunk in response:
                # Yield control back to the event loop frequently
                await asyncio.sleep(0)
                
                delta = chunk.choices[0].delta
                is_final = chunk.choices[0].finish_reason == 'stop'
                
                # Check for reasoning_content (for models like deepseek-reasoner)
                if hasattr(delta, 'reasoning_content') and delta.reasoning_content:
                    # If this is the first reasoning chunk, add the opening tag
                    if not reasoning_started:
                        reasoning_started = True
                        in_reasoning_section = True
                        # First yield the tag, then yield the first token with a space after the tag
                        yield REASONING_START_TAG + " ", None
                        # Now yield the first token of reasoning content
                        yield delta.reasoning_content, None
                    else:
                        # For multi-line reasoning content, add blockquote markers after newlines
                        if delta.reasoning_content.startswith('\n'):
                            yield '\n> ' + delta.reasoning_content[1:], None
                        elif last_char_was_newline:
                            yield '> ' + delta.reasoning_content, None
                            last_char_was_newline = False
                        else:
                            yield delta.reasoning_content, None
                    
                    # Track if this chunk ends with a newline
                    last_char_was_newline = delta.reasoning_content.endswith('\n')
                
                # If there's content and we were in a reasoning section, close the reasoning section
                if hasattr(delta, 'content') and delta.content:
                    if in_reasoning_section:
                        in_reasoning_section = False
                        # Add a space after the REASONING_END_TAG to ensure proper formatting
                        yield REASONING_END_TAG + " ", None
                    
                    # If this is the first content chunk, mark content as started
                    if not content_started:
                        content_started = True
                    
                    # Yield the content with usage stats (if it's the final chunk)
                    yield delta.content, chunk.usage if is_final else None
                
                # If it's the final chunk with no content, yield the usage stats with empty content
                elif is_final:
                    # If we're still in a reasoning section, close it
                    if in_reasoning_section:
                        yield REASONING_END_TAG + " ", None
                    
                    yield "", chunk.usage

        # Use async iteration to process the stream
        async for content, usage in process_stream():
            yield content, usage

        log(LogLevel.DEBUGGING, "Stream complete")

    except Exception as e:
        log(LogLevel.ERROR, f"Error in stream_chat_response: {str(e)}")
        raise