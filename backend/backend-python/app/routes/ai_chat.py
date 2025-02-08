from fastapi import APIRouter, WebSocket
import json
from services.openai_client import stream_chat_response

router = APIRouter()

@router.websocket("/ws/chat")
async def ai_chat_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data_text = await websocket.receive_text()
            data = json.loads(data_text)
            prompt = data.get("prompt")
            if prompt:
                # Stream tokens as they are received.
                async for token in stream_chat_response(prompt):
                    # Each token is sent with done: False
                    message = {"channel": "chatStream", "token": token, "done": False}
                    await websocket.send_text(json.dumps(message))
                # After the entire response has streamed, send a final message.
                await websocket.send_text(json.dumps({"channel": "chatStream", "done": True}))
            else:
                await websocket.send_text(json.dumps({"error": "No prompt provided."}))
    except Exception as e:
        print(f"WebSocket closed with error: {e}") 