from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pathlib import Path
import json
from datetime import datetime
from utils.logging import LogLevel, log, LogPrefix
from services.file_services import chat_manager
import os
from typing import List

router = APIRouter(prefix="/chats")

# Use USER_DATA_DIR as base for CHATS_DIR
USER_DATA_DIR = Path(os.getenv('USER_DATA_DIR', '/user-data'))
CHATS_DIR = Path(os.getenv('CHATS_DIR', USER_DATA_DIR / 'chats'))

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
    system_prompt: str
    temperature: float

class DeleteChatRequest(BaseModel):
    filename: str

@router.post("/save")
async def save_chat(chat_data: ChatData):
    """Save chat history to a file"""
    try:
        log(LogLevel.TEMPORARY, f"Attempting to save chat: {chat_data.filename}", LogPrefix.CHAT)
        
        chat_content = {
            "messages": chat_data.messages,
            "system_prompt": chat_data.system_prompt,
            "temperature": chat_data.temperature,
            "created_at": datetime.now().isoformat()
        }
        
        return await chat_manager.save(chat_data.filename, chat_content)
            
    except Exception as e:
        log(LogLevel.ERROR, f"Error saving chat: {str(e)}", LogPrefix.ERROR)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def list_chats():
    """List all available chat files"""
    try:
        files = await chat_manager.list_files()
        return {"files": files}
    except Exception as e:
        log(LogLevel.ERROR, f"Error listing chats: {str(e)}", LogPrefix.ERROR)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/load")
async def load_chat(request: LoadChatRequest):
    try:
        return await chat_manager.load(request.filename)
    except Exception as e:
        log(LogLevel.ERROR, f"Error loading chat: {str(e)}", LogPrefix.ERROR)
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/delete/{filename}")
async def delete_chat(filename: str):
    """Delete a chat file"""
    try:
        log(LogLevel.TEMPORARY, f"Deleting chat: {filename}", LogPrefix.CHAT)
        return await chat_manager.delete(filename)
    except Exception as e:
        log(LogLevel.ERROR, f"Error deleting chat: {str(e)}", LogPrefix.ERROR)
        raise HTTPException(status_code=500, detail=str(e))

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

@router.post("/delete_chat/{filename}")
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

@router.post("/save")
async def save_chat(request: SaveChatRequest):
    log(LogLevel.MINIMUM, "Route called: POST /chats/save", LogPrefix.SYSTEM)
    chat_data = {
        "messages": request.messages,
        "system_prompt": request.system_prompt,
        "temperature": request.temperature
    }
    return await chat_manager.save(request.filename, chat_data)

@router.post("/delete")
async def delete_chat(request: DeleteChatRequest):
    log(LogLevel.MINIMUM, "Route called: POST /chats/delete", LogPrefix.SYSTEM)
    return await chat_manager.delete(request.filename) 