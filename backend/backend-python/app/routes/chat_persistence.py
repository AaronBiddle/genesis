from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pathlib import Path
import json
from datetime import datetime
from utils.logging import LogLevel, log, LogPrefix

router = APIRouter()
CHATS_DIR = Path("/user-data/chats")

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
        # Sanitize filename and add .json extension if missing
        filename = data.filename.strip()
        if not filename:
            filename = f"chat_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
        if not filename.endswith(".json"):
            filename += ".json"
            
        # Prevent path traversal
        if "/" in filename or "\\" in filename:
            raise ValueError("Invalid filename")
            
        # Create chats directory if it doesn't exist
        CHATS_DIR.mkdir(parents=True, exist_ok=True)
        
        chat_path = CHATS_DIR / filename
        
        # Prepare chat data for saving
        chat_data = {
            "system_prompt": data.system_prompt,
            "temperature": data.temperature,
            "messages": data.messages,
            "created_at": datetime.now().isoformat()
        }
        
        # Save as JSON
        with open(chat_path, "w") as f:
            json.dump(chat_data, f, indent=2)
            
        log(LogLevel.MINIMUM, f"Chat saved to {chat_path}", LogPrefix.FILE)
        return {"status": "success", "saved_path": str(chat_path)}
        
    except Exception as e:
        log(LogLevel.MINIMUM, f"Error saving chat: {str(e)}", LogPrefix.ERROR)
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/load_chat")
async def load_chat(data: LoadRequest):
    try:
        filename = data.filename.strip()
        # Sanitize filename and add .json extension if missing
        if not filename.endswith(".json"):
            filename += ".json"
            
        # Prevent path traversal
        if "/" in filename or "\\" in filename:
            raise ValueError("Invalid filename")
            
        chat_path = CHATS_DIR / filename
        
        if not chat_path.exists():
            raise HTTPException(status_code=404, detail="Chat not found")
            
        with open(chat_path, "r") as f:
            chat_data = json.load(f)
            
        return chat_data
        
    except Exception as e:
        log(LogLevel.MINIMUM, f"💾 Error loading chat: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/list_chats")
async def list_chats():
    try:
        CHATS_DIR.mkdir(parents=True, exist_ok=True)
        chat_files = [f.name for f in CHATS_DIR.glob("*.json")]
        log(LogLevel.DEBUGGING, f"📄 Found chat files: {chat_files}", LogPrefix.FILE)
        return {"chats": chat_files}
    except Exception as e:
        log(LogLevel.MINIMUM, f"Error listing chats: {str(e)}", LogPrefix.ERROR)
        raise HTTPException(status_code=500, detail=str(e)) 