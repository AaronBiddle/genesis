from fastapi import APIRouter, WebSocket
import json
from services.openai_client import stream_chat_response

router = APIRouter()

DEBUG_CHAT = False

@router.websocket("/ws/chat")
async def ai_chat_endpoint(websocket: WebSocket):
    if DEBUG_CHAT: print("🐍 WebSocket connection accepted")
    await websocket.accept()
    try:
        while True:
            data_text = await websocket.receive_text()
            if DEBUG_CHAT: print(f"🐍 Received message: {data_text}")
            data = json.loads(data_text)
            prompt = data.get("prompt")
            history = data.get("history", [])
            
            if prompt:
                if DEBUG_CHAT: print(f"🐍 Processing prompt with history length: {len(history)}")
                async for token in stream_chat_response(prompt, history):
                    message = {"channel": "chatStream", "token": token, "done": False}
                    if DEBUG_CHAT: print(f"🐍 Sending token: {token}", end="", flush=True)
                    await websocket.send_text(json.dumps(message))
                if DEBUG_CHAT: print("\n🐍 Stream complete")
                await websocket.send_text(json.dumps({"channel": "chatStream", "done": True}))
            else:
                if DEBUG_CHAT: print("🐍 Error: No prompt provided")
                await websocket.send_text(json.dumps({"error": "No prompt provided."}))
    except Exception as e:
        if DEBUG_CHAT: print(f"🐍 WebSocket error: {e}") 