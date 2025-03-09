import json
import asyncio
import time
from typing import Dict, Any
from fastapi import WebSocket
from utils.logging import LogLevel, log
from services.model_service import get_model_temperature
from services.openai_client import stream_chat_response
from services.websocket_service import send_error, send_json

async def process_chat_message(websocket: WebSocket, data: Dict[Any, Any], session_id: str, connection_id: int):
    """Process a chat message from a WebSocket client."""
    task_id = id(asyncio.current_task())
    start_time = time.time()
    
    try:
        log(LogLevel.MINIMUM, f"🐍 Processing message for session {session_id} (connection: {connection_id})")
        
        # Extract message type
        message_type = data.get("type")
        if message_type != "message":
            log(LogLevel.ERROR, f"🐍 Unsupported message type: {message_type} (session: {session_id})")
            await send_error(
                websocket, 
                session_id, 
                "Unsupported message type", 
                f"Type '{message_type}' is not supported"
            )
            return
        
        # Extract payload
        payload = data.get("payload", {})
        
        # Create truncated version of data for logging
        debug_data = _create_debug_data(payload)
        log(LogLevel.DEBUGGING, f"🐍 Received message for session {session_id}: {json.dumps(debug_data)}")
        
        try:
            # Extract parameters from payload
            prompt, history, system_prompt, model_id, temperature = _extract_parameters(payload)
            
            # Validate prompt
            if not prompt:
                log(LogLevel.ERROR, f"🐍 No prompt provided for session {session_id}")
                await send_error(websocket, session_id, "No prompt provided.")
                return
            
            # Get temperature from model config if not provided
            temperature = get_model_temperature(model_id, temperature)
            
            # Process history to ensure system prompt is at the beginning
            history = _process_history(history, system_prompt)
            
            # Stream the response
            await _stream_chat_response(websocket, prompt, history, temperature, model_id, session_id)
            
        except json.JSONDecodeError as e:
            log(LogLevel.ERROR, f"🐍 Invalid JSON received for session {session_id}: {e}")
            await send_error(websocket, session_id, "Invalid JSON format")
                
        except Exception as e:
            log(LogLevel.ERROR, f"🐍 Error processing message for session {session_id}: {e}")
            await send_error(websocket, session_id, f"Internal server error: {str(e)}")
    except Exception as e:
        log(LogLevel.ERROR, f"🐍 Task error (session: {session_id}): {str(e)}")
    finally:
        # Log task completion
        end_time = time.time()
        duration = end_time - start_time
        log(LogLevel.MINIMUM, f"🐍 Task completed for session {session_id} (duration: {duration:.1f}s)")

def _create_debug_data(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Create a truncated version of the payload for logging."""
    debug_data = payload.copy()
    
    # Truncate prompt
    if "prompt" in debug_data and debug_data["prompt"]:
        if len(debug_data["prompt"]) > 30:
            debug_data["prompt"] = debug_data["prompt"][:30] + "..."
    
    # Truncate history
    if "history" in debug_data and debug_data["history"]:
        trimmed_history = []
        for msg in debug_data["history"]:
            if "content" in msg and msg["content"]:
                # Trim all message contents for readability
                if len(msg["content"]) > 30:
                    msg_copy = msg.copy()
                    msg_copy["content"] = msg["content"][:30] + "..."
                    trimmed_history.append(msg_copy)
                else:
                    trimmed_history.append(msg)
            else:
                trimmed_history.append(msg)
        debug_data["history"] = trimmed_history
    
    return debug_data

def _extract_parameters(payload: Dict[str, Any]) -> tuple:
    """Extract parameters from the payload."""
    prompt = payload.get("prompt")
    history = payload.get("history", [])
    system_prompt = payload.get("system_prompt")
    model_id = payload.get("model_id")
    temperature = payload.get("temperature")
    
    return prompt, history, system_prompt, model_id, temperature

def _process_history(history: list, system_prompt: str = None) -> list:
    """Process history to ensure system prompt is at the beginning."""
    # First, extract system message if present
    system_message = None
    other_messages = []

    for msg in history:
        if msg.get("role") == "system":
            system_message = msg
        else:
            other_messages.append(msg)

    # Create a new history list starting with the system message
    processed_history = []

    # Add system message (from history or from system_prompt parameter)
    if system_message:
        processed_history.append(system_message)
    elif system_prompt:
        processed_history.append({"role": "system", "content": system_prompt})
    else:
        processed_history.append({"role": "system", "content": "You are a helpful assistant."})

    # Add all other messages
    processed_history.extend(other_messages)
    
    return processed_history

async def _stream_chat_response(websocket: WebSocket, prompt: str, history: list, 
                               temperature: float, model_id: str, session_id: str):
    """Stream the chat response to the WebSocket client."""
    streaming_token_count = 0
    usage_stats = None
    response_started = False
    received_final_chunk = False
    
    try:
        log(LogLevel.MINIMUM, f"🐍 Starting API stream for session {session_id}")
        
        # Use the exact model provided by the frontend
        log_prefix = f"(session: {session_id}) " if session_id else ""
        log(LogLevel.MINIMUM, f"🐍 Using model {model_id} {log_prefix}")
        
        # Create a queue for stream chunks
        chunk_queue = asyncio.Queue()
        
        # Start filling the queue in a separate task
        fill_task = asyncio.create_task(_fill_stream_queue(
            chunk_queue, prompt, history, temperature, model_id, session_id
        ))
        
        # Track time for each chunk
        last_chunk_time = time.time()
        
        # Process chunks from the queue
        while True:
            # Get the next chunk with a short timeout to avoid blocking indefinitely
            try:
                content_chunk, chunk_usage, error = await asyncio.wait_for(chunk_queue.get(), timeout=0.1)
            except asyncio.TimeoutError:
                # No chunk available yet, yield control back to event loop
                await asyncio.sleep(0)
                continue
            
            # Check for end of stream or error
            if error:
                raise error
            if content_chunk is None:
                break
            
            current_time = time.time()
            last_chunk_time = current_time
            
            response_started = True
            if chunk_usage:  # Final chunk with usage stats
                usage_stats = chunk_usage
                received_final_chunk = True
            else:  # Normal token
                streaming_token_count += 1  # Used for progress tracking
                
                # Send the token to the client
                await _send_token(websocket, content_chunk, streaming_token_count, session_id)
        
        # Clean up the fill task
        if not fill_task.done():
            fill_task.cancel()
            try:
                await fill_task
            except asyncio.CancelledError:
                pass
        
        if not response_started:
            raise Exception("No response was generated")
            
        if not received_final_chunk:
            log(LogLevel.MINIMUM, f"🐍 Warning: Stream completed without receiving usage stats (session: {session_id})")
        
        # Send completion message
        await _send_completion(websocket, response_started, usage_stats, streaming_token_count, session_id)
        
    except Exception as e:
        # Enhanced error logging
        error_type = type(e).__name__
        error_msg = str(e)
        error_repr = repr(e)
        error_dict = str(getattr(e, '__dict__', {}))
        
        log(LogLevel.ERROR, f"🐍 Streaming error for session {session_id} - Type: {error_type}, Message: {error_msg}")
        log(LogLevel.ERROR, f"🐍 Error details - Repr: {error_repr}, Attributes: {error_dict} (session: {session_id})")
        
        await send_error(
            websocket, 
            session_id, 
            "Failed to generate response", 
            f"{error_type}: {error_msg}"
        )

async def _fill_stream_queue(queue: asyncio.Queue, prompt: str, history: list, 
                            temperature: float, model_id: str, session_id: str):
    """Fill the queue with stream chunks from the API."""
    try:
        # Verify the selected model is valid
        if not model_id:
            raise ValueError("No model selected for generating response")
            
        log(LogLevel.MINIMUM, f"🐍 Using model {model_id} for session {session_id}")
        
        async for content_chunk, chunk_usage in stream_chat_response(
            prompt, 
            history, 
            temperature, 
            model_id
        ):
            # Check if the content contains reasoning data (from the model via the API)
            if isinstance(content_chunk, dict) and 'reasoning' in content_chunk:
                # If the model provides reasoning directly, send it separately
                await queue.put((content_chunk, chunk_usage, None))
            else:
                # Regular content handling
                await queue.put((content_chunk, chunk_usage, None))
        
        # Mark end of stream
        await queue.put((None, None, None))
    except Exception as e:
        # Enhanced error logging
        error_type = type(e).__name__
        error_msg = str(e)
        error_repr = repr(e)
        error_dict = str(getattr(e, '__dict__', {}))
        
        log(LogLevel.ERROR, f"🐍 Stream error in fill_queue - Type: {error_type}, Message: {error_msg} (session: {session_id})")
        log(LogLevel.ERROR, f"🐍 Error details - Repr: {error_repr}, Attributes: {error_dict} (session: {session_id})")
        
        # Pass the exception to the main processing loop
        await queue.put((None, None, e))

async def _send_token(websocket: WebSocket, content_chunk: Any, token_count: int, session_id: str):
    """Send a token to the WebSocket client."""
    # Handle different chunk formats
    if isinstance(content_chunk, dict) and 'content' in content_chunk:
        # This is a combined content+reasoning chunk from a model that supports it
        
        # Send reasoning data if requested
        if 'reasoning' in content_chunk:
            reasoning_message = {
                "sessionId": session_id,
                "type": "token",
                "reasoning": content_chunk['reasoning'],
                "done": False,
                "tokenCount": token_count
            }
            await send_json(websocket, reasoning_message)
        
        # Send content data
        content_message = {
            "sessionId": session_id,
            "type": "token",
            "token": content_chunk['content'], 
            "done": False,
            "tokenCount": token_count
        }
        await send_json(websocket, content_message)
    else:
        # This is a regular text chunk
        message = {
            "sessionId": session_id,
            "type": "token",
            "token": content_chunk, 
            "done": False,
            "tokenCount": token_count
        }
        await send_json(websocket, message)

async def _send_completion(websocket: WebSocket, response_started: bool, 
                          usage_stats: Any, token_count: int, session_id: str):
    """Send a completion message to the WebSocket client."""
    if not response_started:
        return
        
    if not usage_stats:
        log(LogLevel.MINIMUM, f"🐍 Stream complete without usage stats. Counted tokens: {token_count} (session: {session_id})")
        completion_message = {
            "sessionId": session_id,
            "type": "token",
            "done": True,
            "tokensReceived": token_count,
            "tokensSent": None,
            "warning": "Usage statistics not available"
        }
        await send_json(websocket, completion_message)
    else:
        # Log if there's a significant discrepancy between our count and OpenAI's count
        if abs(token_count - usage_stats.completion_tokens) > 5:
            log(LogLevel.ERROR, f"🐍 Token count discrepancy - Streamed: {token_count}, OpenAI: {usage_stats.completion_tokens} (session: {session_id})")
        
        log(LogLevel.MINIMUM, f"🐍 Stream complete for session {session_id}. Tokens - Input: {usage_stats.prompt_tokens}, Output: {usage_stats.completion_tokens}")
        completion_message = {
            "sessionId": session_id,
            "type": "token",
            "done": True,
            "tokensReceived": usage_stats.completion_tokens,
            "tokensSent": usage_stats.prompt_tokens
        }
        await send_json(websocket, completion_message) 