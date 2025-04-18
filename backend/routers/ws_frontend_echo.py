"""Router for frontend-specific WebSocket endpoints."""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

@router.websocket("/")
async def websocket_endpoint(websocket: WebSocket):
    """Handles WebSocket connections and echoes received messages."""
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Message text was: {data}")
    except WebSocketDisconnect:
        print("Client disconnected") 