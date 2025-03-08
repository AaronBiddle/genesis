import os
import asyncio
import sys
from typing import AsyncGenerator, Any, Dict, Optional, List
from openai import OpenAI
from dotenv import load_dotenv, find_dotenv
from utils.logging import LogLevel, log
from services.model_service import get_model_api_details, get_model_temperature
import json
import time

# Load environment variables from .env file.
dotenv_path = find_dotenv()
print(f"dotenv_path: {dotenv_path}")
load_dotenv(dotenv_path)

# Initialize global variables
DEFAULT_MODEL_CONFIG = None
DEFAULT_MODEL_ID = None
DEFAULT_TEMPERATURE = 0.7
client = None

try:
    # Get default model configuration
    DEFAULT_MODEL_CONFIG = get_model_api_details()
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
        model_config = get_model_api_details(model_id)
        if not model_config:
            log(LogLevel.ERROR, f"No configuration found for model: {model_id}")
            raise ValueError(f"No configuration found for model: {model_id}")
            
        api_key = model_config.get("api_key")
        base_url = model_config.get("base_url")
        
        if not api_key or not base_url:
            log(LogLevel.ERROR, f"Invalid configuration for model {model_id}: missing api_key or base_url")
            raise ValueError(f"Invalid configuration for model {model_id}: missing api_key or base_url")
            
        return OpenAI(
            api_key=api_key,
            base_url=base_url
        )
    except Exception as e:
        error_type = type(e).__name__
        log(LogLevel.ERROR, f"Error getting client for model {model_id}: {error_type} - {str(e)}")
        raise

def chat_completion_sync(prompt: str, model_id: Optional[str] = None, temperature: Optional[float] = None) -> str:
    """
    Synchronously gets a chat completion using the API.
    """
    try:
        model_config = get_model_api_details(model_id)
        model_id = model_config.get("model_id")
        temp = get_model_temperature(model_id, temperature)
    
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
            # For models that support reasoning, just return the content
            # The reasoning_content will be available as a separate property if needed
            return response.choices[0].message.content.strip()
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
        model_config = get_model_api_details(model_id)
        model_id = model_config.get("model_id")
        temp = get_model_temperature(model_id, temperature)
    
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
        # Get model configuration and client
        model_id, temp, client_instance = _prepare_model_and_client(model_id, temperature)
        
        # Prepare messages
        messages = _prepare_messages(history, prompt)
        
        # Log debug information
        _log_debug_messages(messages, model_id, temp)
        
        # Create the completion in a separate thread to avoid blocking
        response = await _create_streaming_completion(client_instance, messages, model_id, temp)

        # Process chunks as they arrive
        async for content, usage in _process_stream(response):
            yield content, usage

        log(LogLevel.DEBUGGING, "Stream complete")

    except Exception as e:
        _log_enhanced_error("stream_chat_response", e)
        # Re-raise for proper error handling up the chain
        raise

def _prepare_model_and_client(model_id: Optional[str], temperature: Optional[float]) -> tuple:
    """Prepare model configuration and client."""
    # Get model configuration
    model_config = get_model_api_details(model_id)
    if not model_config:
        log(LogLevel.ERROR, f"No configuration found for model: {model_id}")
        raise ValueError(f"No configuration found for model: {model_id}")
        
    model_id = model_config.get("model_id")
    if not model_id:
        log(LogLevel.ERROR, f"Model ID not specified in configuration")
        raise ValueError(f"Model ID not specified in configuration")
        
    temp = get_model_temperature(model_id, temperature)
    
    try:
        client_instance = get_client_for_model(model_id)
    except Exception as client_err:
        log(LogLevel.ERROR, f"Failed to create client for model {model_id}: {str(client_err)}")
        raise
        
    return model_id, temp, client_instance

def _prepare_messages(history: List[Dict[str, str]] = None, prompt: str = None) -> List[Dict[str, str]]:
    """Prepare messages for the API call."""
    messages = []
    
    # Extract system message from history if present
    system_message = None
    other_messages = []
    
    if history:
        for msg in history:
            if msg["role"] == "system":
                # Save the system message
                system_message = msg
            else:
                # Save other messages
                other_messages.append(msg)
    
    # Always add system message first
    if system_message:
        messages.append(system_message)
    else:
        # Default system message if none provided
        messages.append({"role": "system", "content": "You are a helpful assistant."})
    
    # Process other messages to combine consecutive messages of the same role
    processed_messages = []
    
    for msg in other_messages:
        if processed_messages and processed_messages[-1]["role"] == msg["role"]:
            # Combine with previous message of the same role
            processed_messages[-1]["content"] += "\n\n" + msg["content"]
            log(LogLevel.DEBUGGING, f"Combining consecutive {msg['role']} messages")
        else:
            # Add as a new message
            processed_messages.append(msg.copy())
    
    # Add processed messages
    messages.extend(processed_messages)
    
    # Add the current prompt as a user message
    if prompt:
        if messages and messages[-1]["role"] == "user":
            # Combine with the last user message
            messages[-1]["content"] += "\n\n" + prompt
            log(LogLevel.DEBUGGING, f"Combining prompt with last user message")
        else:
            # Add as a new message
            messages.append({"role": "user", "content": prompt})
            
    return messages

def _log_debug_messages(messages: List[Dict[str, str]], model_id: str, temperature: float):
    """Log debug information about the messages."""
    # Create truncated version of messages for logging
    debug_messages = []
    for msg in messages:
        role = msg["role"]
        content = msg["content"]
        
        # Trim all message contents for readability
        if content and len(content) > 30:
            trimmed_content = content[:30] + "..."
        else:
            trimmed_content = content
            
        debug_messages.append({
            "role": role,
            "content": trimmed_content
        })
        
    log(LogLevel.DEBUGGING, f"Sending messages to {model_id} (temp={temperature}): {json.dumps(debug_messages)}")

async def _create_streaming_completion(client_instance: OpenAI, messages: List[Dict[str, str]], 
                                     model_id: str, temperature: float):
    """Create a streaming completion in a separate thread."""
    loop = asyncio.get_running_loop()
    try:
        return await loop.run_in_executor(
            None,
            lambda: client_instance.chat.completions.create(
                messages=messages,
                model=model_id,
                temperature=temperature,
                stream=True
            )
        )
    except Exception as api_err:
        log(LogLevel.ERROR, f"API call failed for model {model_id}: {type(api_err).__name__} - {str(api_err)}")
        api_error_details = getattr(api_err, "__dict__", {})
        log(LogLevel.ERROR, f"API error details: {str(api_error_details)}")
        raise

async def _process_stream(response):
    """Process the streaming response."""
    for chunk in response:
        # Yield control back to the event loop frequently
        await asyncio.sleep(0)
        
        delta = chunk.choices[0].delta
        is_final = chunk.choices[0].finish_reason == 'stop'
        
        # Check for content and reasoning separately
        content = None
        reasoning = None
        
        # Extract reasoning content if available
        if hasattr(delta, 'reasoning_content') and delta.reasoning_content:
            reasoning = delta.reasoning_content
        
        # Extract regular content if available
        if hasattr(delta, 'content') and delta.content:
            content = delta.content
        
        # If it's a model that provides reasoning, return both content and reasoning
        if reasoning is not None:
            # Return an object with both content and reasoning
            yield {
                'content': content or '',
                'reasoning': reasoning
            }, chunk.usage if is_final else None
        elif content is not None:
            # For regular content, just return the content string
            yield content, chunk.usage if is_final else None
        elif is_final:
            # Final chunk with no content, yield empty string with usage stats
            yield "", chunk.usage

def _log_enhanced_error(function_name: str, error: Exception):
    """Log enhanced error information."""
    error_type = type(error).__name__
    error_msg = str(error)
    error_repr = repr(error)
    error_dict = getattr(error, '__dict__', {})
    
    log(LogLevel.ERROR, f"Error in {function_name} - Type: {error_type}, Message: {error_msg}")
    log(LogLevel.ERROR, f"Error details - Repr: {error_repr}, Attributes: {error_dict}")