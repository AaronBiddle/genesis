from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json

router = APIRouter()

@router.websocket('/ws/worker-test')
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            # Process the data and respond accordingly
            await websocket.send_text(f"Message received: {data}")
    except WebSocketDisconnect:
        print("Worker disconnected") 

@router.websocket('/ws/worker-requests')
async def worker_requests_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Receive JSON data from the client
            data = await websocket.receive_json()
            
            # Extract the text field from the received dictionary
            if "text" in data:
                text = data["text"]
                # Process the text and respond
                response = {"status": "success", "message": f"Received text: {text}"}
            else:
                response = {"status": "error", "message": "Missing 'text' field in request"}
            
            # Send the response back to the client
            await websocket.send_json(response)
    except WebSocketDisconnect:
        print("Worker requests connection disconnected")
    except Exception as e:
        print(f"Error in worker requests endpoint: {str(e)}")
        try:
            await websocket.send_json({"status": "error", "message": str(e)})
        except:
            pass 