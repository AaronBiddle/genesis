from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
import json
import asyncio
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

router = APIRouter()

# Global variables to store websocket connections
worker_socket = None
frontend_socket = None

@router.websocket('/ws/worker-test')
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            # Process the data and respond accordingly
            await websocket.send_text(f"Message received: {data}")
    except WebSocketDisconnect:
        logger.info("Worker disconnected from test endpoint") 

@router.websocket('/ws/worker-connect')
async def worker_connect_endpoint(websocket: WebSocket):
    global worker_socket
    await websocket.accept()
    worker_socket = websocket
    logger.info("Worker connected and stored in global variable")
    try:
        # Keep the connection alive
        while True:
            # Wait for any message from the worker
            data = await websocket.receive_text()
            
            # Special handling for heartbeat messages to avoid echo loops
            if data == "WORKER_HEARTBEAT":
                logger.debug("Received worker heartbeat")
                # Just acknowledge heartbeats without echoing the full message
                await websocket.send_text("Acknowledged: heartbeat")
            # Handle progress updates from worker and forward to frontend
            elif data.startswith("PROGRESS:") or data.startswith("PROGRESS_IMAGE:"):
                # Log truncated message for regular logs
                truncated_data = data[:50] + "..." if len(data) > 50 else data
                logger.info(f"Received progress update from worker: {truncated_data}")
                
                # Forward to frontend if connected
                if frontend_socket is not None:
                    try:
                        # For regular progress updates
                        if data.startswith("PROGRESS:"):
                            message = data[9:]  # Remove the "PROGRESS:" prefix
                            await frontend_socket.send_json({"type": "progress", "message": message})
                            logger.debug("Progress update forwarded to frontend")
                        # For progress updates with images
                        elif data.startswith("PROGRESS_IMAGE:"):
                            parts = data[14:].split(":", 1)  # Remove the "PROGRESS_IMAGE:" prefix and split once
                            if len(parts) == 2:
                                message, image_data = parts
                                await frontend_socket.send_json({
                                    "type": "progress_image", 
                                    "message": message,
                                    "image": image_data
                                })
                                logger.debug(f"Progress update with image forwarded to frontend")
                        # Acknowledge receipt to the worker
                        await websocket.send_text("Acknowledged: progress forwarded to frontend")
                    except Exception as e:
                        logger.error(f"Error forwarding to frontend: {str(e)}")
                        await websocket.send_text("Acknowledged: progress received but frontend not available")
                else:
                    logger.warning("Progress update received but no frontend connected")
                    await websocket.send_text("Acknowledged: progress received but no frontend connected")
            else:
                # For other messages, send the normal acknowledgment
                logger.info(f"Received from worker: {data[:50]}..." if len(data) > 50 else data)
                await websocket.send_text(f"Acknowledged: {data}")
    except WebSocketDisconnect:
        logger.info("Worker disconnected")
        # Clear the global variable when the worker disconnects
        worker_socket = None
    except Exception as e:
        logger.error(f"Error in worker connection: {str(e)}")
        worker_socket = None

@router.websocket('/ws/frontend-requests')
async def frontend_requests_endpoint(websocket: WebSocket):
    global frontend_socket  # Declare the global variable
    await websocket.accept()
    frontend_socket = websocket  # Store the frontend connection
    logger.info("Frontend client connected and stored in global variable")
    try:
        while True:
            # Receive JSON data from the client
            data = await websocket.receive_json()
            
            # Extract the text field from the received dictionary
            if "text" in data:
                text = data["text"]
                # Process the text and respond
                response = {"status": "success", "message": f"Received text: {text}"}
                logger.info(f"Received request from frontend: {text[:50]}..." if len(text) > 50 else text)
                
                # If we have a worker connection, forward the message to the worker
                if worker_socket is not None:
                    try:
                        await worker_socket.send_json({"request_from_frontend": text})
                        logger.debug("Request forwarded to worker")
                    except Exception as e:
                        logger.error(f"Error sending to worker: {str(e)}")
            else:
                response = {"status": "error", "message": "Missing 'text' field in request"}
                logger.warning("Received invalid request from frontend (missing 'text' field)")
            
            # Send the response back to the client
            await websocket.send_json(response)
    except WebSocketDisconnect:
        logger.info("Frontend requests connection disconnected")
        frontend_socket = None  # Clear the global variable when disconnected
    except Exception as e:
        logger.error(f"Error in frontend requests endpoint: {str(e)}")
        frontend_socket = None  # Clear the global variable on error
        try:
            await websocket.send_json({"status": "error", "message": str(e)})
        except:
            pass 

async def send_to_frontend_socket(message_data):
    """
    Utility function to send a message to the connected frontend client.
    
    Args:
        message_data: The data to send to the frontend
        
    Returns:
        bool: True if the message was sent successfully, False otherwise
    """
    if frontend_socket is None:
        logger.warning("Cannot send to frontend: No frontend client connected")
        return False
    
    try:
        await frontend_socket.send_json(message_data)
        logger.debug("Message sent to frontend successfully")
        return True
    except Exception as e:
        logger.error(f"Error sending to frontend: {str(e)}")
        return False

@router.post('/send-to-frontend')
async def send_to_frontend(message: dict):
    """
    Send a message to the connected frontend client.
    
    Args:
        message: A dictionary containing the message to send
        
    Returns:
        A dictionary with the status of the operation
    """
    if frontend_socket is None:
        raise HTTPException(status_code=503, detail="No frontend client connected")
    
    logger.info(f"Attempting to send message to frontend via HTTP endpoint")
    success = await send_to_frontend_socket(message)
    if success:
        return {"status": "success", "message": "Message sent to frontend"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send message to frontend") 