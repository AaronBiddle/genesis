from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
from services.openai_client import stream_chat_response
from utils.logging import LogLevel, log

router = APIRouter()

DEBUG_CHAT = False

@router.websocket("/ws/chat")
async def ai_chat_endpoint(websocket: WebSocket):
    try:
        await websocket.accept()        
        
        while True:
            data_text = await websocket.receive_text()
            log(LogLevel.MINIMUM, f"Received message ({len(data_text)} bytes)")
            
            # Create truncated version of data for logging
            data = json.loads(data_text)
            debug_data = data.copy()
            if "prompt" in debug_data:
                debug_data["prompt"] = debug_data["prompt"][:10] + "..."
            if "history" in debug_data and debug_data["history"]:
                for msg in debug_data["history"]:
                    if "content" in msg:
                        # Keep full system prompts, truncate other messages
                        if msg.get("role") == "system":
                            continue
                        msg["content"] = msg["content"][:10] + "..."
            log(LogLevel.DEBUGGING, f"Received message: {json.dumps(debug_data)}")
            
            try:
                prompt = data.get("prompt")
                history = data.get("history", [])
                system_prompt = data.get("system_prompt")
                temperature = data.get("temperature", 0.7)  # Default to 0.7 if not provided
                
                if not prompt:
                    log(LogLevel.ERROR, "Error: No prompt provided")
                    await websocket.send_text(json.dumps({"error": "No prompt provided."}))
                    continue
                
                # Add system prompt to history if not already present
                if system_prompt and (not history or history[0].get("role") != "system"):
                    history.insert(0, {"role": "system", "content": system_prompt})
                
                streaming_token_count = 0
                usage_stats = None
                response_started = False
                received_final_chunk = False
                
                try:
                    async for content_chunk, chunk_usage in stream_chat_response(prompt, history, temperature):
                        response_started = True
                        if chunk_usage:  # Final chunk with usage stats
                            usage_stats = chunk_usage
                            received_final_chunk = True
                            log(LogLevel.DEBUGGING, "🐍 Received final chunk with usage stats")
                        else:  # Normal token
                            streaming_token_count += 1  # Used for progress tracking
                            message = {
                                "channel": "chatStream", 
                                "token": content_chunk, 
                                "done": False,
                                "tokenCount": streaming_token_count  # Helps client track progress
                            }
                            await websocket.send_text(json.dumps(message))
                    
                    if not response_started:
                        raise Exception("No response was generated")
                        
                    if not received_final_chunk:
                        log(LogLevel.MINIMUM, "🐍 Warning: Stream completed without receiving usage stats")
                        
                except Exception as e:
                    error_message = str(e)
                    log(LogLevel.MINIMUM, f"🐍 Streaming error: {error_message}")
                    await websocket.send_text(json.dumps({
                        "error": "Failed to generate response",
                        "details": error_message
                    }))
                    continue
                
                # Send completion message
                if response_started:
                    if not usage_stats:
                        log(LogLevel.MINIMUM, f"🐍 Stream complete without usage stats. Counted tokens: {streaming_token_count}")
                        await websocket.send_text(json.dumps({
                            "channel": "chatStream", 
                            "done": True,
                            "tokensReceived": streaming_token_count,
                            "tokensSent": None,
                            "warning": "Usage statistics not available"
                        }))
                    else:
                        # Log if there's a significant discrepancy between our count and OpenAI's count
                        if abs(streaming_token_count - usage_stats.completion_tokens) > 5:
                            log(LogLevel.ERROR, f"🐍 Token count discrepancy - Streamed: {streaming_token_count}, OpenAI: {usage_stats.completion_tokens}")
                        
                        log(LogLevel.MINIMUM, f"🐍 Stream complete. Tokens - Input: {usage_stats.prompt_tokens}, Output: {usage_stats.completion_tokens}")
                        await websocket.send_text(json.dumps({
                            "channel": "chatStream", 
                            "done": True,
                            "tokensReceived": usage_stats.completion_tokens,
                            "tokensSent": usage_stats.prompt_tokens
                        }))
                    
            except json.JSONDecodeError as e:
                log(LogLevel.ERROR, f"🐍 Invalid JSON received: {e}")
                await websocket.send_text(json.dumps({"error": "Invalid JSON format"}))
            except Exception as e:
                log(LogLevel.ERROR, f"🐍 Error processing message: {e}")
                await websocket.send_text(json.dumps({"error": f"Internal server error: {str(e)}"}))
                
    except WebSocketDisconnect as e:
        close_codes = {
            1000: "Normal closure",
            1001: "Client going away",
            1002: "Protocol error",
            1003: "Unsupported data",
            1007: "Invalid frame payload data",
            1008: "Policy violation",
            1009: "Message too big",
            1010: "Mandatory extension",
            1011: "Internal server error",
        }
        reason = close_codes.get(e.code, "Unknown reason")
        log(LogLevel.MINIMUM, f"WebSocket closed: {reason} (code: {e.code})")
    except Exception as e:
        log(LogLevel.MINIMUM, f"🐍 WebSocket error: {str(e)}") 