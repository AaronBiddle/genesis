from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pathlib import Path
import json
from datetime import datetime
from utils.logging import LogLevel, log, LogPrefix
from .file_management.directory_handler import DirectoryManager
from os import getenv
from typing import List

router = APIRouter(prefix="/chats")

# Initialize directory manager
CHATS_DIR = Path(getenv('CHATS_DIR', '/user-data/chats'))
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
        # Get all .json files from the chats directory
        chat_files = list(Path("user-data/chats").glob("*.json"))
        # Return just the filenames without extension
        return {
            "files": [chat.stem for chat in chat_files]
        }
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