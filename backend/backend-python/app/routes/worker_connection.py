from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json

router = APIRouter()

# Global variable to store the worker websocket connection
worker_socket = None

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

@router.websocket('/ws/worker-connect')
async def worker_connect_endpoint(websocket: WebSocket):
    global worker_socket
    await websocket.accept()
    worker_socket = websocket
    print("Worker connected and stored in global variable")
    try:
        # Keep the connection alive
        while True:
            # Wait for any message from the worker
            data = await websocket.receive_text()
            
            # Special handling for heartbeat messages to avoid echo loops
            if data == "WORKER_HEARTBEAT":
                print("Received worker heartbeat")
                # Just acknowledge heartbeats without echoing the full message
                await websocket.send_text("Acknowledged: heartbeat")
            else:
                # For other messages, send the normal acknowledgment
                print(f"Received from worker: {data}")
                await websocket.send_text(f"Acknowledged: {data}")
    except WebSocketDisconnect:
        print("Worker disconnected")
        # Clear the global variable when the worker disconnects
        worker_socket = None
    except Exception as e:
        print(f"Error in worker connection: {str(e)}")
        worker_socket = None

@router.websocket('/ws/frontend-requests')
async def frontend_requests_endpoint(websocket: WebSocket):
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
                
                # If we have a worker connection, forward the message to the worker
                if worker_socket is not None:
                    try:
                        await worker_socket.send_json({"request_from_frontend": text})
                    except Exception as e:
                        print(f"Error sending to worker: {str(e)}")
            else:
                response = {"status": "error", "message": "Missing 'text' field in request"}
            
            # Send the response back to the client
            await websocket.send_json(response)
    except WebSocketDisconnect:
        print("Frontend requests connection disconnected")
    except Exception as e:
        print(f"Error in frontend requests endpoint: {str(e)}")
        try:
            await websocket.send_json({"status": "error", "message": str(e)})
        except:
            pass 