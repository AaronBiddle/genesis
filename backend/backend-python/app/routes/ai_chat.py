from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
from services.openai_client import stream_chat_response
from utils.logging import LogLevel, log
from utils.config import get_model_config
import asyncio
import time
from typing import Dict, Any, Set, List, Optional

router = APIRouter()

DEBUG_CHAT = False

# Track active tasks by session ID
active_tasks: Dict[str, Set[asyncio.Task]] = {}

# Track message queues by session ID
message_queues: Dict[str, List[Dict[str, Any]]] = {}

@router.websocket("/ws/chat")
async def ai_chat_endpoint(websocket: WebSocket):
    """WebSocket endpoint for AI chat."""
    connection_id = id(asyncio.current_task())
    
    try:
        # Accept the WebSocket connection
        await websocket.accept()
        log(LogLevel.MINIMUM, f"🐍 WebSocket connection established")
        
        # Start the message receiver and processor tasks
        log(LogLevel.MINIMUM, f"🐍 Starting message receiver and processor tasks")
        receiver_task = asyncio.create_task(message_receiver(websocket, connection_id))
        processor_task = asyncio.create_task(message_processor(websocket, connection_id))
        
        # Wait for both tasks to complete (they should run indefinitely unless there's an error)
        done, pending = await asyncio.wait(
            [receiver_task, processor_task],
            return_when=asyncio.FIRST_COMPLETED
        )
        
        # If we get here, one of the tasks has completed (likely due to an error)
        for task in done:
            if task.exception():
                log(LogLevel.ERROR, f"🐍 Task failed with exception: {task.exception()}")
        
        # Cancel any pending tasks
        for task in pending:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
    
    except WebSocketDisconnect:
        log(LogLevel.MINIMUM, f"🐍 WebSocket disconnected")
    except Exception as e:
        log(LogLevel.ERROR, f"🐍 WebSocket error: {str(e)}")
        try:
            await websocket.close()
        except:
            pass
    finally:
        # Clean up any resources associated with this connection
        log(LogLevel.MINIMUM, f"🐍 WebSocket connection closed")

async def message_receiver(websocket: WebSocket, connection_id: int):
    """Task that receives messages from the WebSocket."""
    try:
        log(LogLevel.MINIMUM, f"🐍 Message receiver started (connection: {connection_id})")
        
        while True:
            # Wait for a message from the client
            log(LogLevel.DEBUGGING, f"🐍 Waiting for next message")
            data_str = await websocket.receive_text()
            
            try:
                # Parse the message
                data = json.loads(data_str)
                
                # Extract session ID
                session_id = data.get("sessionId")
                if not session_id:
                    log(LogLevel.ERROR, f"🐍 No session ID provided in message")
                    await websocket.send_text(json.dumps({
                        "error": "No session ID provided"
                    }))
                    continue
                
                # Create a queue for this session if it doesn't exist
                if session_id not in message_queues:
                    message_queues[session_id] = []
                    log(LogLevel.MINIMUM, f"🐍 Created new message queue for session {session_id}")
                
                # Add message to the queue
                message_queues[session_id].append(data)
                log(LogLevel.MINIMUM, f"🐍 Added message to queue for session {session_id} (queue size: {len(message_queues[session_id])})")
                
            except json.JSONDecodeError:
                log(LogLevel.ERROR, f"🐍 Invalid JSON received: {data_str[:100]}...")
                await websocket.send_text(json.dumps({
                    "error": "Invalid JSON format"
                }))
            
    except Exception as e:
        log(LogLevel.ERROR, f"🐍 Message receiver error: {str(e)}")
        raise

async def message_processor(websocket: WebSocket, connection_id: int):
    """Task that processes messages from the queue."""
    try:
        log(LogLevel.MINIMUM, f"🐍 Message processor started (connection: {connection_id})")
        iteration = 0
        last_log_time = time.time()
        
        while True:
            iteration += 1
            processing_started = False
            current_time = time.time()
            
            # Check all message queues
            for session_id, queue in list(message_queues.items()):
                if queue:
                    processing_started = True
                    # Get the next message
                    data = queue.pop(0)
                    log(LogLevel.MINIMUM, f"🐍 Processing message from queue for session {session_id} (remaining: {len(queue)})")
                    
                    # Initialize task set for this session if it doesn't exist
                    if session_id not in active_tasks:
                        active_tasks[session_id] = set()
                        log(LogLevel.MINIMUM, f"🐍 Created new task set for session {session_id}")
                    
                    # Create a new task to process this message concurrently
                    task = asyncio.create_task(process_message(websocket, data, session_id, connection_id))
                    active_tasks[session_id].add(task)
                    log(LogLevel.MINIMUM, f"🐍 Created new task for session {session_id} (active tasks: {len(active_tasks[session_id])})")
            
            # Clean up completed tasks
            for session_id, tasks in list(active_tasks.items()):
                done_tasks = {t for t in tasks if t.done()}
                if done_tasks:
                    log(LogLevel.MINIMUM, f"🐍 Cleaning up {len(done_tasks)} completed tasks for session {session_id}")
                    for task in done_tasks:
                        active_tasks[session_id].discard(task)
                        # Check for exceptions
                        if task.exception():
                            log(LogLevel.ERROR, f"🐍 Task failed with exception (session: {session_id}): {task.exception()}")
            
            # Log processor status periodically (every 30 seconds) or when processing starts
            if processing_started or (current_time - last_log_time > 30):
                active_count = sum(len(tasks) for tasks in active_tasks.values())
                queue_count = sum(len(queue) for queue in message_queues.values())
                last_log_time = current_time
            
            # Sleep briefly to avoid CPU spinning
            await asyncio.sleep(0.01)
            
    except Exception as e:
        log(LogLevel.ERROR, f"🐍 Message processor error: {str(e)}")
        raise

async def process_message(websocket: WebSocket, data: Dict[Any, Any], session_id: str, connection_id: int):
    task_id = id(asyncio.current_task())
    start_time = time.time()
    try:
        log(LogLevel.MINIMUM, f"🐍 Processing message for session {session_id} (connection: {connection_id})")
        
        # Extract message type
        message_type = data.get("type")
        if message_type != "message":
            log(LogLevel.ERROR, f"🐍 Unsupported message type: {message_type} (session: {session_id})")
            await websocket.send_text(json.dumps({
                "sessionId": session_id,
                "error": "Unsupported message type",
                "details": f"Type '{message_type}' is not supported"
            }))
            return
        
        # Extract payload
        payload = data.get("payload", {})
        
        # Create truncated version of data for logging
        debug_data = payload.copy()
        if "prompt" in debug_data:
            debug_data["prompt"] = debug_data["prompt"][:10] + "..."
        if "history" in debug_data and debug_data["history"]:
            for msg in debug_data["history"]:
                if "content" in msg:
                    # Keep full system prompts, truncate other messages
                    if msg.get("role") == "system":
                        continue
                    msg["content"] = msg["content"][:10] + "..."
        log(LogLevel.DEBUGGING, f"🐍 Received message for session {session_id}: {json.dumps(debug_data)}")
        
        try:
            prompt = payload.get("prompt")
            history = payload.get("history", [])
            system_prompt = payload.get("system_prompt")
            model_id = payload.get("model_id")  # Get model_id from payload if provided
            
            # Get temperature from payload or model config
            temperature = payload.get("temperature")
            if temperature is None and model_id:
                model_config = get_model_config(model_id)
                temperature = model_config.get("temperature_default")
            
            if not prompt:
                log(LogLevel.ERROR, f"🐍 No prompt provided for session {session_id}")
                await websocket.send_text(json.dumps({
                    "sessionId": session_id,
                    "error": "No prompt provided."
                }))
                return
            
            # Process history to ensure system prompt is at the beginning
            # First, remove any existing system messages from history
            history = [msg for msg in history if msg.get("role") != "system"]
            
            # Then add system prompt at the beginning if provided
            if system_prompt:
                history.insert(0, {"role": "system", "content": system_prompt})
            
            streaming_token_count = 0
            usage_stats = None
            response_started = False
            received_final_chunk = False
            
            try:
                log(LogLevel.MINIMUM, f"🐍 Starting API stream for session {session_id}")
                
                # Create a queue for stream chunks
                chunk_queue = asyncio.Queue()
                
                # Function to fill the queue from the stream
                async def fill_queue():
                    try:
                        async for content_chunk, chunk_usage in stream_chat_response(
                            prompt, 
                            history, 
                            temperature, 
                            model_id
                        ):
                            await chunk_queue.put((content_chunk, chunk_usage, None))
                        # Mark end of stream
                        await chunk_queue.put((None, None, None))
                    except Exception as e:
                        log(LogLevel.ERROR, f"🐍 Stream error in fill_queue: {str(e)} (session: {session_id})")
                        await chunk_queue.put((None, None, e))
                
                # Start filling the queue in a separate task
                fill_task = asyncio.create_task(fill_queue())
                
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
                    chunk_delay = current_time - last_chunk_time
                    last_chunk_time = current_time
                    
                    response_started = True
                    if chunk_usage:  # Final chunk with usage stats
                        usage_stats = chunk_usage
                        received_final_chunk = True
                    else:  # Normal token
                        streaming_token_count += 1  # Used for progress tracking
                                              
                        message = {
                            "sessionId": session_id,
                            "type": "token",
                            "token": content_chunk, 
                            "done": False,
                            "tokenCount": streaming_token_count  # Helps client track progress
                        }
                        await websocket.send_text(json.dumps(message))
                
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
                    
            except Exception as e:
                error_message = str(e)
                log(LogLevel.ERROR, f"🐍 Streaming error for session {session_id}: {error_message}")
                await websocket.send_text(json.dumps({
                    "sessionId": session_id,
                    "type": "error",
                    "error": "Failed to generate response",
                    "details": error_message
                }))
                return
            
            # Send completion message
            if response_started:
                completion_time = time.time()
                if not usage_stats:
                    log(LogLevel.MINIMUM, f"🐍 Stream complete without usage stats. Counted tokens: {streaming_token_count} (session: {session_id})")
                    await websocket.send_text(json.dumps({
                        "sessionId": session_id,
                        "type": "token",
                        "done": True,
                        "tokensReceived": streaming_token_count,
                        "tokensSent": None,
                        "warning": "Usage statistics not available"
                    }))
                else:
                    # Log if there's a significant discrepancy between our count and OpenAI's count
                    if abs(streaming_token_count - usage_stats.completion_tokens) > 5:
                        log(LogLevel.ERROR, f"🐍 Token count discrepancy - Streamed: {streaming_token_count}, OpenAI: {usage_stats.completion_tokens} (session: {session_id})")
                    
                    log(LogLevel.MINIMUM, f"🐍 Stream complete for session {session_id}. Tokens - Input: {usage_stats.prompt_tokens}, Output: {usage_stats.completion_tokens}")
                    await websocket.send_text(json.dumps({
                        "sessionId": session_id,
                        "type": "token",
                        "done": True,
                        "tokensReceived": usage_stats.completion_tokens,
                        "tokensSent": usage_stats.prompt_tokens
                    }))
            
        except json.JSONDecodeError as e:
            log(LogLevel.ERROR, f"🐍 Invalid JSON received for session {session_id}: {e}")
            await websocket.send_text(json.dumps({
                "sessionId": session_id,
                "type": "error",
                "error": "Invalid JSON format"
            }))
        except Exception as e:
            log(LogLevel.ERROR, f"🐍 Error processing message for session {session_id}: {e}")
            await websocket.send_text(json.dumps({
                "sessionId": session_id,
                "type": "error",
                "error": f"Internal server error: {str(e)}"
            }))
    except Exception as e:
        log(LogLevel.ERROR, f"🐍 Task error (session: {session_id}): {str(e)}")
    finally:
        # Log task completion
        end_time = time.time()
        duration = end_time - start_time
        log(LogLevel.MINIMUM, f"🐍 Task completed for session {session_id} (duration: {duration:.1f}s)") 