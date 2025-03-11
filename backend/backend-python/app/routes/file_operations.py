from fastapi import APIRouter, HTTPException, Query, Path as FastAPIPath
from pydantic import BaseModel
from typing import Dict, List, Any, Optional, Union
from utils.logging import log, LogLevel
from services.file_services import chat_manager, document_manager, prompt_manager

router = APIRouter(prefix="/files", tags=["files"])

# Base models
class BaseFileRequest(BaseModel):
    filename: str

class FileContent(BaseModel):
    filename: str
    file_type: str
    content: Union[str, Dict[str, Any]]  # String for documents, Dict for chats

# Map file types to their managers
TYPE_TO_MANAGER = {
    'chat': chat_manager,
    'document': document_manager,
    'prompt': prompt_manager
}

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
        # Get the appropriate file manager for the file type
        file_manager = TYPE_TO_MANAGER.get(file_type)
        if not file_manager:
            log(LogLevel.ERROR, f"Invalid file type: {file_type}")
            raise HTTPException(status_code=400, detail="Invalid file type")
        
        # Validate content type based on file type
        if file_type in ["document", "prompt"] and not isinstance(file_content.content, str):
            raise HTTPException(status_code=400, detail=f"{file_type} content must be a string")
        
        if file_type == "chat":
            if not isinstance(file_content.content, dict):
                raise HTTPException(status_code=400, detail="Chat content must be a dictionary")
            
            required_fields = ["messages", "system_prompt", "temperature"]
            for field in required_fields:
                if field not in file_content.content:
                    raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Use the file manager to save the content
        result = await file_manager.save(file_content.filename, file_content.content)
        
        return {
            "status": "success", 
            "message": f"{file_type} saved successfully", 
            "filename": file_content.filename
        }
    
    except HTTPException:
        raise
    except Exception as e:
        log(LogLevel.ERROR, f"Error saving file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save {file_type}: {str(e)}")

@router.get("/{file_type}/list", response_model=Dict[str, Any])
async def list_files(file_type: str = FastAPIPath(..., regex="^(document|chat|prompt)$")):
    """List all files of the specified type"""
    try:
        # Get the appropriate file manager for the file type
        file_manager = TYPE_TO_MANAGER.get(file_type)
        if not file_manager:
            log(LogLevel.ERROR, f"Invalid file type: {file_type}")
            raise HTTPException(status_code=400, detail="Invalid file type")
        
        # Use the file manager to list files
        files = await file_manager.list_files()
        
        return {"files": files}
    
    except HTTPException:
        raise
    except Exception as e:
        log(LogLevel.ERROR, f"Error listing files: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list {file_type}s: {str(e)}")

@router.post("/{file_type}/load", response_model=Dict[str, Any])
async def load_file(
    file_request: BaseFileRequest,
    file_type: str = FastAPIPath(..., regex="^(document|chat|prompt)$")
):
    """Load a file of the specified type"""
    try:
        # Get the appropriate file manager for the file type
        file_manager = TYPE_TO_MANAGER.get(file_type)
        if not file_manager:
            log(LogLevel.ERROR, f"Invalid file type: {file_type}")
            raise HTTPException(status_code=400, detail="Invalid file type")
        
        # Use the file manager to load the content
        content = await file_manager.load(file_request.filename)
        
        if file_type == "document" or file_type == "prompt":
            return {"filename": file_request.filename, "content": content}
        
        elif file_type == "chat":
            # Ensure the chat data has the expected structure
            required_fields = ["messages", "system_prompt", "temperature"]
            for field in required_fields:
                if field not in content:
                    content[field] = [] if field == "messages" else "" if field == "system_prompt" else 0.7
            
            return {
                "filename": file_request.filename,
                "messages": content["messages"],
                "system_prompt": content["system_prompt"],
                "temperature": content["temperature"]
            }
    
    except HTTPException:
        raise
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
        # Get the appropriate file manager for the file type
        file_manager = TYPE_TO_MANAGER.get(file_type)
        if not file_manager:
            log(LogLevel.ERROR, f"Invalid file type: {file_type}")
            raise HTTPException(status_code=400, detail="Invalid file type")
        
        # Use the file manager to delete the file
        result = await file_manager.delete(filename)
        
        return {"status": "success", "message": f"{file_type} deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        log(LogLevel.ERROR, f"Error deleting file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete {file_type}: {str(e)}") 