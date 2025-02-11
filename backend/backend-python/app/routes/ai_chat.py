from fastapi import APIRouter, WebSocket
import json
from services.openai_client import stream_chat_response
from utils.logging import LogLevel, log, debug_log

router = APIRouter()

DEBUG_CHAT = False

@router.websocket("/ws/chat")
@debug_log(LogLevel.DEBUGGING)
async def ai_chat_endpoint(websocket: WebSocket):
    log(LogLevel.MINIMUM, "🐍 WebSocket connection accepted")
    await websocket.accept()
    try:
        while True:
            data_text = await websocket.receive_text()
            log(LogLevel.MINIMUM, f"🐍 Received message ({len(data_text)} bytes)")
            log(LogLevel.DEBUGGING, f"🐍 Received message: {data_text}")
            
            try:
                data = json.loads(data_text)
                prompt = data.get("prompt")
                history = data.get("history", [])
                
                if not prompt:
                    log(LogLevel.MINIMUM, "🐍 Error: No prompt provided")
                    await websocket.send_text(json.dumps({"error": "No prompt provided."}))
                    continue
                
                streaming_token_count = 0  # Renamed to clarify purpose
                usage_stats = None
                response_started = False
                received_final_chunk = False
                
                try:
                    async for token, usage in stream_chat_response(prompt, history):
                        response_started = True
                        if usage:  # Final chunk with usage stats
                            usage_stats = usage
                            received_final_chunk = True
                            log(LogLevel.DEBUGGING, "🐍 Received final chunk with usage stats")
                        else:  # Normal token
                            streaming_token_count += 1  # Used for progress tracking
                            message = {
                                "channel": "chatStream", 
                                "token": token, 
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
                            log(LogLevel.MINIMUM, f"🐍 Token count discrepancy - Streamed: {streaming_token_count}, OpenAI: {usage_stats.completion_tokens}")
                        
                        log(LogLevel.MINIMUM, f"🐍 Stream complete. Tokens - Input: {usage_stats.prompt_tokens}, Output: {usage_stats.completion_tokens}")
                        await websocket.send_text(json.dumps({
                            "channel": "chatStream", 
                            "done": True,
                            "tokensReceived": usage_stats.completion_tokens,
                            "tokensSent": usage_stats.prompt_tokens
                        }))
                    
            except json.JSONDecodeError as e:
                log(LogLevel.MINIMUM, f"🐍 Invalid JSON received: {e}")
                await websocket.send_text(json.dumps({"error": "Invalid JSON format"}))
            except Exception as e:
                log(LogLevel.MINIMUM, f"🐍 Error processing message: {e}")
                await websocket.send_text(json.dumps({"error": f"Internal server error: {str(e)}"}))
                
    except Exception as e:
        log(LogLevel.MINIMUM, f"🐍 WebSocket error: {e}") 