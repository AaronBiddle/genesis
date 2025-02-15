from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pathlib import Path
import json
from datetime import datetime
from utils.logging import LogLevel, log, LogPrefix
from .file_management.directory_handler import DirectoryManager
from os import getenv
import os
from typing import List

router = APIRouter(prefix="/chats")

# Use USER_DATA_DIR as base for CHATS_DIR
USER_DATA_DIR = Path(os.getenv('USER_DATA_DIR', '/user-data'))
CHATS_DIR = Path(os.getenv('CHATS_DIR', USER_DATA_DIR / 'chats'))

# Initialize directory manager
chat_manager = DirectoryManager(
    allowed_extensions=['.json'],
    base_path=CHATS_DIR
)

class ChatData(BaseModel):
    filename: str
    messages: list
    system_prompt: str
    temperature: float

class LoadRequest(BaseModel):
    filename: str

class LoadChatRequest(BaseModel):
    filename: str

class SaveChatRequest(BaseModel):
    filename: str
    messages: list
    system_prompt: str = "You are a helpful assistant..."
    temperature: float = 0.7

@router.post("/save_chat")
async def save_chat(data: ChatData):
    try:
        file_path = chat_manager.validate_filename(data.filename)
        
        # Prepare chat data for saving
        chat_data = {
            "system_prompt": data.system_prompt,
            "temperature": data.temperature,
            "messages": data.messages,
            "created_at": datetime.now().isoformat()
        }
        
        # Save as JSON
        with open(file_path, "w") as f:
            json.dump(chat_data, f, indent=2)
            
        log(LogLevel.MINIMUM, f"Chat saved to {file_path}", LogPrefix.FILE)
        return {"status": "success", "saved_path": str(file_path)}
        
    except Exception as e:
        log(LogLevel.MINIMUM, f"Error saving chat: {str(e)}", LogPrefix.ERROR)
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/load_chat")
async def load_chat(data: LoadRequest):
    try:
        file_path = chat_manager.validate_filename(data.filename)
        chat_manager.ensure_file_exists(file_path)
        
        with open(file_path, "r") as f:
            chat_data = json.load(f)
            
        return chat_data
        
    except Exception as e:
        log(LogLevel.MINIMUM, f"💾 Error loading chat: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/list")
async def list_chats():
    """List all available chat files"""
    try:
        chat_files = list(CHATS_DIR.glob("*.json"))
        response = {
            "files": [chat.stem for chat in chat_files]
        }
        log(LogLevel.DEBUGGING, f"Returning chat files: {response}")
        return response
    except Exception as e:
        log(LogLevel.ERROR, f"Error listing chats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/delete_chat/{filename}")
async def delete_chat(filename: str):
    try:
        file_path = chat_manager.validate_filename(filename)
        chat_manager.ensure_file_exists(file_path)
        
        file_path.unlink()  # Delete the file
        log(LogLevel.DEBUGGING, f"Deleted chat: {filename}", LogPrefix.FILE)
        return {"status": "success", "deleted": filename}
        
    except Exception as e:
        log(LogLevel.MINIMUM, f"Error deleting chat: {str(e)}", LogPrefix.ERROR)
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/load")
async def load_chat(request: LoadChatRequest):
    """Load a chat from a file"""
    try:
        filename = request.filename if request.filename.endswith('.json') else f"{request.filename}.json"
        file_path = CHATS_DIR / filename
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"Chat file {filename} not found")
        
        with open(file_path, 'r') as f:
            content = f.read()
            chat_data = json.loads(content)
            log(LogLevel.DEBUGGING, f"Loaded chat data: {len(content)} bytes")
            return chat_data
            
    except HTTPException:
        raise
    except Exception as e:
        log(LogLevel.ERROR, f"Error loading chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/save")
async def save_chat(request: SaveChatRequest):
    """Save a chat to a file"""
    try:
        filename = request.filename if request.filename.endswith('.json') else f"{request.filename}.json"
        file_path = CHATS_DIR / filename
        
        chat_data = {
            "messages": request.messages,
            "system_prompt": request.system_prompt,
            "temperature": request.temperature
        }
        
        with open(file_path, 'w') as f:
            json.dump(chat_data, f, indent=2)
            
        log(LogLevel.DEBUGGING, f"Saved chat to {filename}")
        return {"filename": request.filename}
            
    except Exception as e:
        log(LogLevel.ERROR, f"Error saving chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/delete/{filename}")
async def delete_chat(filename: str):
    """Delete a chat file"""
    try:
        filename = filename if filename.endswith('.json') else f"{filename}.json"
        file_path = CHATS_DIR / filename
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"Chat file {filename} not found")
            
        file_path.unlink()
        log(LogLevel.DEBUGGING, f"Deleted chat file: {filename}")
        return {"deleted": filename}
            
    except HTTPException:
        raise
    except Exception as e:
        log(LogLevel.ERROR, f"Error deleting chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 