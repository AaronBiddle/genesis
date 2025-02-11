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
                
                if prompt:
                    token_count = 0
                    usage_stats = None
                    log(LogLevel.DEBUGGING, f"🐍 Processing prompt with history length: {len(history)}")
                    try:
                        async for token, usage in stream_chat_response(prompt, history):
                            if usage:  # This is the final yield with usage stats
                                usage_stats = usage
                            else:  # This is a normal token
                                token_count += 1
                                message = {
                                    "channel": "chatStream", 
                                    "token": token, 
                                    "done": False,
                                    "tokenCount": token_count
                                }
                                log(LogLevel.VERBOSE, f"🐍 Sending token {token_count}: {token}", end="")
                                await websocket.send_text(json.dumps(message))
                    except Exception as e:
                        error_message = str(e)
                        if "maximum context length" in error_message.lower():
                            log(LogLevel.MINIMUM, f"🐍 Error: Input exceeds maximum token limit: {error_message}")
                            await websocket.send_text(json.dumps({
                                "error": "Input exceeds maximum token limit",
                                "details": error_message
                            }))
                            continue
                        else:
                            raise
                    
                    if usage_stats:
                        log(LogLevel.MINIMUM, f"🐍 Stream complete. Tokens - Input: {usage_stats.prompt_tokens}, Output: {usage_stats.completion_tokens}")
                    
                    await websocket.send_text(json.dumps({
                        "channel": "chatStream", 
                        "done": True,
                        "tokensReceived": usage_stats.completion_tokens if usage_stats else token_count,
                        "tokensSent": usage_stats.prompt_tokens if usage_stats else None,
                    }))
                else:
                    log(LogLevel.MINIMUM, "🐍 Error: No prompt provided")
                    await websocket.send_text(json.dumps({"error": "No prompt provided."}))
            except Exception as e:
                log(LogLevel.MINIMUM, f"🐍 Error processing message: {e}")
    except Exception as e:
        log(LogLevel.MINIMUM, f"🐍 WebSocket error: {e}") 