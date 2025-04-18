"""Router for frontend-specific WebSocket endpoints."""
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, WebSocketException

router = APIRouter()

@router.websocket("/")
async def websocket_endpoint(websocket: WebSocket):
    """Handles WebSocket connections, expects JSON, adds URL, and echoes back."""
    await websocket.accept()
    ws_url = str(websocket.url) # Get the WebSocket URL
    try:
        while True:
            try:
                data = await websocket.receive_json()
                if not isinstance(data, dict):
                    await websocket.send_json({"error": "Invalid payload format, expected a JSON object."})
                    continue

                await websocket.send_json(data)
            except json.JSONDecodeError:
                await websocket.send_json({"error": "Invalid JSON received."})
            except WebSocketException as e:
                print(f"WebSocketException: {e}")
                # Handle specific WebSocket errors if needed
                break # Or continue, depending on desired behavior
            except Exception as e:
                print(f"An unexpected error occurred: {e}")
                await websocket.send_json({"error": "An unexpected error occurred."})
                # Consider whether to break or continue

    except WebSocketDisconnect:
        print(f"Client disconnected from {ws_url}")
    finally:
        # Ensure connection is closed if not already
        # await websocket.close() # Usually handled by FastAPI/Starlette
        pass 