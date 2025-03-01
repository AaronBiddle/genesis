from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

@router.websocket('/ws/worker')
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            # Process the data and respond accordingly
            await websocket.send_text(f"Message received: {data}")
    except WebSocketDisconnect:
        print("Worker disconnected") 