from fastapi import APIRouter, HTTPException, Query, Path as FastAPIPath
from pydantic import BaseModel
from typing import Dict, List, Any, Optional, Union
import os
import json
from pathlib import Path
from utils.logging import log, LogLevel
from services.file_services import CHATS_DIR, DOCUMENTS_DIR, PROMPTS_DIR

router = APIRouter(prefix="/files", tags=["files"])

# Base models
class BaseFileRequest(BaseModel):
    filename: str

class FileContent(BaseModel):
    filename: str
    file_type: str
    content: Union[str, Dict[str, Any]]  # String for documents, Dict for chats

# Map file types to their base directories
TYPE_TO_DIR = {
    'chat': CHATS_DIR,
    'document': DOCUMENTS_DIR,
    'prompt': PROMPTS_DIR
}

# Helper functions
def get_base_directory(file_type: str) -> Path:
    """Get the base directory for a specific file type"""
    base_dir = TYPE_TO_DIR.get(file_type)
    if not base_dir:
        raise ValueError(f"Unsupported file type: {file_type}")
    return base_dir

def is_safe_path(path: Path, base_dir: Path) -> bool:
    """Check if a path is safe (doesn't escape the base directory)"""
    try:
        path.resolve().relative_to(base_dir.resolve())
        return True
    except (ValueError, RuntimeError):
        return False

# Unified API endpoints
@router.post("/{file_type}/save", response_model=Dict[str, Any])
async def save_file(
    file_type: str = FastAPIPath(..., regex="^(document|chat|prompt)$"),
    file_content: FileContent = None
):
    """
    Save a file of the specified type.
    
    For documents: content should be a string
    For chats: content should be a dict with messages, system_prompt, and temperature
    """
    # Validate that the file_type in the path matches the one in the request
    if file_content.file_type != file_type:
        raise HTTPException(status_code=400, detail=f"File type mismatch: {file_content.file_type} vs {file_type}")
    
    try:
        base_dir = get_base_directory(file_type)
        file_path = base_dir / file_content.filename
        
        log(LogLevel.DEBUGGING, f"DEBUG - save_file - base_dir: {base_dir}, file_path: {file_path}")
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        # Ensure the path is safe
        if not is_safe_path(file_path, base_dir):
            raise HTTPException(status_code=400, detail="Invalid file path")
        
        # Save the file based on its type
        if file_type == "document" or file_type == "prompt":
            if not isinstance(file_content.content, str):
                raise HTTPException(status_code=400, detail=f"{file_type} content must be a string")
            
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(file_content.content)
        
        elif file_type == "chat":
            if not isinstance(file_content.content, dict):
                raise HTTPException(status_code=400, detail="Chat content must be a dictionary")
            
            required_fields = ["messages", "system_prompt", "temperature"]
            for field in required_fields:
                if field not in file_content.content:
                    raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
            
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(file_content.content, f, ensure_ascii=False, indent=2)
        
        return {"status": "success", "message": f"{file_type} saved successfully", "filename": file_content.filename}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save {file_type}: {str(e)}")

@router.get("/{file_type}/list", response_model=Dict[str, Any])
async def list_files(file_type: str = FastAPIPath(..., regex="^(document|chat|prompt)$")):
    """List all files of the specified type"""
    try:
        base_dir = get_base_directory(file_type)
        
        log(LogLevel.DEBUGGING, f"DEBUG - list_files - base_dir: {base_dir}")
        
        if not os.path.exists(base_dir):
            os.makedirs(base_dir, exist_ok=True)
            return {"files": []}
        
        files = []
        for root, _, filenames in os.walk(base_dir):
            for filename in filenames:
                if filename.startswith("."):  # Skip hidden files
                    continue
                
                rel_path = os.path.relpath(os.path.join(root, filename), base_dir)
                files.append(rel_path.replace("\\", "/"))  # Normalize path separators
        
        return {"files": files}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list {file_type}s: {str(e)}")

@router.post("/{file_type}/load", response_model=Dict[str, Any])
async def load_file(
    file_request: BaseFileRequest,
    file_type: str = FastAPIPath(..., regex="^(document|chat|prompt)$")
):
    """Load a file of the specified type"""
    try:
        log(LogLevel.DEBUGGING, f"DEBUG - load_file - file_type: {file_type}, file_request: {file_request}")
        
        base_dir = get_base_directory(file_type)
        file_path = base_dir / file_request.filename
        
        log(LogLevel.DEBUGGING, f"DEBUG - load_file - base_dir: {base_dir}, file_path: {file_path}")
        
        # Ensure the path is safe
        if not is_safe_path(file_path, base_dir):
            log(LogLevel.ERROR, f"Invalid file path: {file_path}")
            raise HTTPException(status_code=400, detail="Invalid file path")
        
        if not os.path.exists(file_path):
            log(LogLevel.ERROR, f"File not found: {file_path}")
            raise HTTPException(status_code=404, detail=f"{file_type} not found")
        
        if file_type == "document" or file_type == "prompt":
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            return {"filename": file_request.filename, "content": content}
        
        elif file_type == "chat":
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    chat_data = json.load(f)
                
                # Ensure the chat data has the expected structure
                required_fields = ["messages", "system_prompt", "temperature"]
                for field in required_fields:
                    if field not in chat_data:
                        chat_data[field] = [] if field == "messages" else "" if field == "system_prompt" else 0.7
                
                return {
                    "filename": file_request.filename,
                    "messages": chat_data["messages"],
                    "system_prompt": chat_data["system_prompt"],
                    "temperature": chat_data["temperature"]
                }
            except json.JSONDecodeError as e:
                log(LogLevel.ERROR, f"Invalid JSON format in chat file: {file_path}, error: {e}")
                raise HTTPException(status_code=400, detail="Invalid JSON format in chat file")
    
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format in chat file")
    except Exception as e:
        log(LogLevel.ERROR, f"Error loading file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to load {file_type}: {str(e)}")

@router.delete("/{file_type}/delete/{filename:path}", response_model=Dict[str, Any])
async def delete_file(
    filename: str,
    file_type: str = FastAPIPath(..., regex="^(document|chat|prompt)$")
):
    """Delete a file of the specified type"""
    try:
        base_dir = get_base_directory(file_type)
        file_path = base_dir / filename
        
        log(LogLevel.DEBUGGING, f"DEBUG - delete_file - base_dir: {base_dir}, file_path: {file_path}")
        
        # Ensure the path is safe
        if not is_safe_path(file_path, base_dir):
            raise HTTPException(status_code=400, detail="Invalid file path")
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"{file_type} not found")
        
        os.remove(file_path)
        
        return {"status": "success", "message": f"{file_type} deleted successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete {file_type}: {str(e)}") 