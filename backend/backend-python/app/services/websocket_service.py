import json
from typing import Dict, Any
from fastapi import WebSocket
from utils.logging import LogLevel, log

# Track active connections
active_connections = {}

async def connect_websocket(websocket: WebSocket, connection_id: int) -> None:
    """
    Accept a WebSocket connection and store it in active_connections.
    
    Args:
        websocket (WebSocket): The WebSocket connection.
        connection_id (int): The unique ID for this connection.
    """
    await websocket.accept()
    active_connections[connection_id] = websocket
    log(LogLevel.MINIMUM, f"🐍 WebSocket connection established (connection: {connection_id})")

def disconnect_websocket(connection_id: int) -> None:
    """
    Remove a WebSocket connection from active_connections.
    
    Args:
        connection_id (int): The unique ID for the connection to remove.
    """
    if connection_id in active_connections:
        del active_connections[connection_id]
    log(LogLevel.MINIMUM, f"🐍 WebSocket connection closed (connection: {connection_id})")

async def send_error(websocket: WebSocket, session_id: str, error_message: str, details: str = None) -> None:
    """
    Send an error message to the client.
    
    Args:
        websocket (WebSocket): The WebSocket connection.
        session_id (str): The session ID.
        error_message (str): The error message.
        details (str, optional): Additional error details.
    """
    error_data = {
        "sessionId": session_id,
        "type": "error",
        "error": error_message
    }
    
    if details:
        error_data["details"] = details
        
    await websocket.send_text(json.dumps(error_data))
    log(LogLevel.ERROR, f"🐍 Error sent to client (session: {session_id}): {error_message}")

async def send_json(websocket: WebSocket, data: Dict[str, Any]) -> None:
    """
    Send JSON data to the client.
    
    Args:
        websocket (WebSocket): The WebSocket connection.
        data (Dict[str, Any]): The data to send.
    """
    await websocket.send_text(json.dumps(data))

async def broadcast_message(message: Dict[str, Any]) -> None:
    """
    Broadcast a message to all active connections.
    
    Args:
        message (Dict[str, Any]): The message to broadcast.
    """
    disconnected = []
    
    for connection_id, websocket in active_connections.items():
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            log(LogLevel.ERROR, f"🐍 Error broadcasting to connection {connection_id}: {str(e)}")
            disconnected.append(connection_id)
    
    # Clean up disconnected connections
    for connection_id in disconnected:
        disconnect_websocket(connection_id)
        
    if disconnected:
        log(LogLevel.MINIMUM, f"🐍 Removed {len(disconnected)} disconnected connections during broadcast")

def get_connection_count() -> int:
    """
    Get the number of active WebSocket connections.
    
    Returns:
        int: The number of active connections.
    """
    return len(active_connections) 