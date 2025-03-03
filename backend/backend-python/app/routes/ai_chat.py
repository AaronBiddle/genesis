from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
from services.openai_client import stream_chat_response
from utils.logging import LogLevel, log
import asyncio
import time
from typing import Dict, Any, Set, List

router = APIRouter()

DEBUG_CHAT = False

# Track active tasks by session ID
active_tasks: Dict[str, Set[asyncio.Task]] = {}

# Track message queues by session ID
message_queues: Dict[str, List[Dict[str, Any]]] = {}

@router.websocket("/ws/chat")
async def ai_chat_endpoint(websocket: WebSocket):
    connection_id = id(websocket)  # Unique identifier for this connection
    try:
        await websocket.accept()
        log(LogLevel.MINIMUM, f"🐍 WebSocket connection established (id: {connection_id})")
        
        # Create a task to receive messages
        log(LogLevel.MINIMUM, f"🐍 Starting message receiver task (connection: {connection_id})")
        receiver_task = asyncio.create_task(
            message_receiver(websocket, connection_id)
        )
        
        # Create a task to process messages from the queue
        log(LogLevel.MINIMUM, f"🐍 Starting message processor task (connection: {connection_id})")
        processor_task = asyncio.create_task(
            message_processor(websocket, connection_id)
        )
        
        # Wait for either task to complete
        log(LogLevel.MINIMUM, f"🐍 Waiting for tasks to complete (connection: {connection_id})")
        done, pending = await asyncio.wait(
            [receiver_task, processor_task],
            return_when=asyncio.FIRST_COMPLETED
        )
        
        # Log which task completed
        for task in done:
            if task == receiver_task:
                log(LogLevel.MINIMUM, f"🐍 Message receiver task completed (connection: {connection_id})")
            elif task == processor_task:
                log(LogLevel.MINIMUM, f"🐍 Message processor task completed (connection: {connection_id})")
        
        # Cancel any pending tasks
        for task in pending:
            task_name = "receiver" if task == receiver_task else "processor"
            log(LogLevel.MINIMUM, f"🐍 Cancelling {task_name} task (connection: {connection_id})")
            task.cancel()
            
        # Re-raise any exceptions
        for task in done:
            if task.exception():
                log(LogLevel.ERROR, f"🐍 Task failed with exception (connection: {connection_id}): {task.exception()}")
                raise task.exception()
            
    except WebSocketDisconnect as e:
        close_codes = {
            1000: "Normal closure",
            1001: "Going away",
            1006: "Abnormal closure",
            1011: "Internal server error"
        }
        reason = close_codes.get(e.code, f"Code {e.code}")
        log(LogLevel.MINIMUM, f"🐍 WebSocket closed (id: {connection_id}): {reason}, active sessions: {len(active_tasks)}")
        
        # Clean up tasks for all sessions using this connection
        for session_id, tasks in active_tasks.items():
            if tasks:
                log(LogLevel.MINIMUM, f"🐍 Cancelling {len(tasks)} tasks for session {session_id}")
                for task in tasks:
                    if not task.done():
                        task.cancel()
    
    except Exception as e:
        log(LogLevel.ERROR, f"🐍 WebSocket error (id: {connection_id}): {str(e)}")
        # Try to close the connection gracefully
        try:
            await websocket.close(code=1011, reason="Internal server error")
        except:
            pass

async def message_receiver(websocket: WebSocket, connection_id: int):
    """Task that receives messages from the WebSocket and adds them to the queue."""
    try:
        log(LogLevel.MINIMUM, f"🐍 Message receiver started (connection: {connection_id})")
        while True:
            # Log that we're waiting for a message
            log(LogLevel.MINIMUM, f"🐍 Waiting for next message (connection: {connection_id})")
            
            # Wait for the next message
            data_text = await websocket.receive_text()
            receive_time = time.time()
            log(LogLevel.MINIMUM, f"🐍 Received message at {receive_time:.3f} ({len(data_text)} bytes, connection: {connection_id})")
            
            # Parse the message
            data = json.loads(data_text)
            
            # Extract session ID
            session_id = data.get("sessionId")
            if not session_id:
                log(LogLevel.ERROR, f"🐍 Missing sessionId in message (connection: {connection_id})")
                await websocket.send_text(json.dumps({
                    "error": "Missing sessionId in message"
                }))
                continue
            
            # Initialize message queue for this session if it doesn't exist
            if session_id not in message_queues:
                message_queues[session_id] = []
                log(LogLevel.MINIMUM, f"🐍 Created new message queue for session {session_id} (connection: {connection_id})")
            
            # Add message to the queue
            message_queues[session_id].append(data)
            log(LogLevel.MINIMUM, f"🐍 Added message to queue for session {session_id} at {time.time():.3f} (queue size: {len(message_queues[session_id])}, connection: {connection_id})")
            
    except Exception as e:
        log(LogLevel.ERROR, f"🐍 Message receiver error (connection: {connection_id}): {str(e)}")
        raise

async def message_processor(websocket: WebSocket, connection_id: int):
    """Task that processes messages from the queue."""
    try:
        log(LogLevel.MINIMUM, f"🐍 Message processor started (connection: {connection_id})")
        iteration = 0
        
        while True:
            iteration += 1
            processing_started = False
            
            # Check all message queues
            for session_id, queue in list(message_queues.items()):
                if queue:
                    processing_started = True
                    # Get the next message
                    data = queue.pop(0)
                    process_time = time.time()
                    log(LogLevel.MINIMUM, f"🐍 Processing message from queue for session {session_id} at {process_time:.3f} (remaining: {len(queue)}, connection: {connection_id})")
                    
                    # Initialize task set for this session if it doesn't exist
                    if session_id not in active_tasks:
                        active_tasks[session_id] = set()
                        log(LogLevel.MINIMUM, f"🐍 Created new task set for session {session_id} (connection: {connection_id})")
                    
                    # Create a new task to process this message concurrently
                    task = asyncio.create_task(process_message(websocket, data, session_id, connection_id))
                    active_tasks[session_id].add(task)
                    log(LogLevel.MINIMUM, f"🐍 Created new task for session {session_id} at {time.time():.3f} (connection: {connection_id}, active tasks: {len(active_tasks[session_id])})")
            
            # Clean up completed tasks
            for session_id, tasks in list(active_tasks.items()):
                done_tasks = {t for t in tasks if t.done()}
                if done_tasks:
                    log(LogLevel.MINIMUM, f"🐍 Cleaning up {len(done_tasks)} completed tasks for session {session_id} (connection: {connection_id})")
                    for task in done_tasks:
                        active_tasks[session_id].discard(task)
                        # Check for exceptions
                        if task.exception():
                            log(LogLevel.ERROR, f"🐍 Task failed with exception (session: {session_id}, connection: {connection_id}): {task.exception()}")
            
            # Log processor iteration
            if iteration % 100 == 0 or processing_started:
                active_count = sum(len(tasks) for tasks in active_tasks.values())
                queue_count = sum(len(queue) for queue in message_queues.values())
                log(LogLevel.MINIMUM, f"🐍 Processor iteration {iteration}: {active_count} active tasks, {queue_count} queued messages (connection: {connection_id})")
            
            # Sleep briefly to avoid CPU spinning
            await asyncio.sleep(0.01)
            
    except Exception as e:
        log(LogLevel.ERROR, f"🐍 Message processor error (connection: {connection_id}): {str(e)}")
        raise

async def process_message(websocket: WebSocket, data: Dict[Any, Any], session_id: str, connection_id: int):
    task_id = id(asyncio.current_task())
    start_time = time.time()
    try:
        log(LogLevel.MINIMUM, f"🐍 Starting to process message for session {session_id} at {start_time:.3f} (connection: {connection_id}, task: {task_id})")
        
        # Extract message type
        message_type = data.get("type")
        if message_type != "message":
            log(LogLevel.ERROR, f"🐍 Unsupported message type: {message_type} (session: {session_id}, connection: {connection_id})")
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
            temperature = payload.get("temperature", 0.7)  # Default to 0.7 if not provided
            
            if not prompt:
                log(LogLevel.ERROR, f"🐍 No prompt provided for session {session_id} (connection: {connection_id})")
                await websocket.send_text(json.dumps({
                    "sessionId": session_id,
                    "error": "No prompt provided."
                }))
                return
            
            # Add system prompt to history if not already present
            if system_prompt and (not history or history[0].get("role") != "system"):
                history.insert(0, {"role": "system", "content": system_prompt})
            
            streaming_token_count = 0
            usage_stats = None
            response_started = False
            received_final_chunk = False
            
            try:
                log(LogLevel.MINIMUM, f"🐍 Starting API stream for session {session_id} at {time.time():.3f} (connection: {connection_id}, task: {task_id})")
                
                # Track time for each chunk
                last_chunk_time = time.time()
                
                async for content_chunk, chunk_usage in stream_chat_response(prompt, history, temperature):
                    current_time = time.time()
                    chunk_delay = current_time - last_chunk_time
                    last_chunk_time = current_time
                    
                    response_started = True
                    if chunk_usage:  # Final chunk with usage stats
                        usage_stats = chunk_usage
                        received_final_chunk = True
                        log(LogLevel.MINIMUM, f"🐍 Received final chunk with usage stats at {current_time:.3f} (session: {session_id}, task: {task_id}, delay: {chunk_delay:.3f}s)")
                    else:  # Normal token
                        streaming_token_count += 1  # Used for progress tracking
                        
                        # Log every 50 tokens or if there's a significant delay
                        if streaming_token_count % 50 == 0 or chunk_delay > 0.5:
                            log(LogLevel.MINIMUM, f"🐍 Streaming token {streaming_token_count} at {current_time:.3f} (session: {session_id}, task: {task_id}, delay: {chunk_delay:.3f}s)")
                        
                        message = {
                            "sessionId": session_id,
                            "type": "token",
                            "token": content_chunk, 
                            "done": False,
                            "tokenCount": streaming_token_count  # Helps client track progress
                        }
                        await websocket.send_text(json.dumps(message))
                
                if not response_started:
                    raise Exception("No response was generated")
                    
                if not received_final_chunk:
                    log(LogLevel.MINIMUM, f"🐍 Warning: Stream completed without receiving usage stats at {time.time():.3f} (session: {session_id}, task: {task_id})")
                    
            except Exception as e:
                error_message = str(e)
                log(LogLevel.MINIMUM, f"🐍 Streaming error for session {session_id} at {time.time():.3f}: {error_message} (connection: {connection_id})")
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
                    log(LogLevel.MINIMUM, f"🐍 Stream complete without usage stats at {completion_time:.3f}. Counted tokens: {streaming_token_count} (session: {session_id}, task: {task_id})")
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
                        log(LogLevel.ERROR, f"🐍 Token count discrepancy - Streamed: {streaming_token_count}, OpenAI: {usage_stats.completion_tokens} (session: {session_id}, task: {task_id})")
                    
                    log(LogLevel.MINIMUM, f"🐍 Stream complete at {completion_time:.3f} for session {session_id}. Tokens - Input: {usage_stats.prompt_tokens}, Output: {usage_stats.completion_tokens} (task: {task_id}, total time: {completion_time - start_time:.3f}s)")
                    await websocket.send_text(json.dumps({
                        "sessionId": session_id,
                        "type": "token",
                        "done": True,
                        "tokensReceived": usage_stats.completion_tokens,
                        "tokensSent": usage_stats.prompt_tokens
                    }))
            
        except json.JSONDecodeError as e:
            log(LogLevel.ERROR, f"🐍 Invalid JSON received for session {session_id} at {time.time():.3f}: {e} (connection: {connection_id})")
            await websocket.send_text(json.dumps({
                "sessionId": session_id,
                "type": "error",
                "error": "Invalid JSON format"
            }))
        except Exception as e:
            log(LogLevel.ERROR, f"🐍 Error processing message for session {session_id} at {time.time():.3f}: {e} (connection: {connection_id})")
            await websocket.send_text(json.dumps({
                "sessionId": session_id,
                "type": "error",
                "error": f"Internal server error: {str(e)}"
            }))
    except Exception as e:
        log(LogLevel.ERROR, f"🐍 Task error at {time.time():.3f} (session: {session_id}, task: {task_id}): {str(e)}")
    finally:
        # Log task completion
        end_time = time.time()
        duration = end_time - start_time
        log(LogLevel.MINIMUM, f"🐍 Task completed at {end_time:.3f} for session {session_id} (task: {task_id}, duration: {duration:.3f}s)") 