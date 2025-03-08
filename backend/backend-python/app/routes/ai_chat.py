from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
from services.chat_service import process_chat_message
from services.websocket_service import connect_websocket, disconnect_websocket, send_error
from utils.logging import LogLevel, log
import asyncio

router = APIRouter()

@router.websocket("/ws/chat")
async def ai_chat_endpoint(websocket: WebSocket):
    """WebSocket endpoint for AI chat."""
    connection_id = id(asyncio.current_task())
    
    try:
        # Accept the WebSocket connection
        await connect_websocket(websocket, connection_id)
        
        # Process messages
        while True:
            # Wait for a message from the client
            data_str = await websocket.receive_text()
            
            try:
                # Parse the message
                data = json.loads(data_str)
                
                # Extract session ID
                session_id = data.get("sessionId")
                if not session_id:
                    log(LogLevel.ERROR, f"🐍 No session ID provided in message")
                    await send_error(websocket, "unknown", "No session ID provided")
                    continue
                
                # Process the message in a separate task
                asyncio.create_task(
                    process_chat_message(websocket, data, session_id, connection_id)
                )
                
            except json.JSONDecodeError:
                log(LogLevel.ERROR, f"🐍 Invalid JSON received: {data_str[:100]}...")
                await send_error(websocket, "unknown", "Invalid JSON format")
    
    except WebSocketDisconnect:
        log(LogLevel.MINIMUM, f"🐍 WebSocket disconnected")
    except Exception as e:
        log(LogLevel.ERROR, f"🐍 WebSocket error: {str(e)}")
    finally:
        # Clean up the connection
        disconnect_websocket(connection_id) 