from fastapi import APIRouter, HTTPException, Path as FastAPIPath
from services.file_services import chat_dir_manager, document_dir_manager, prompt_dir_manager
from utils.logging import log, LogLevel

router = APIRouter(prefix="/directory", tags=["directory"])

# Map file types to their directory managers
TYPE_TO_MANAGER = {
    'chat': chat_dir_manager,
    'document': document_dir_manager,
    'prompt': prompt_dir_manager
}

@router.get("/{file_type}/list", response_model=dict)
@router.get("/{file_type}/list/{path:path}", response_model=dict)
async def list_directory(
    path: str = "",
    file_type: str = FastAPIPath(..., regex="^(chat|document|prompt)$")
):
    """List contents of a directory relative to type-specific base directory"""
    try:
        # Get the appropriate directory manager for the file type
        dir_manager = TYPE_TO_MANAGER.get(file_type)
        if not dir_manager:
            log(LogLevel.ERROR, f"Invalid file type: {file_type}")
            raise HTTPException(status_code=400, detail="Invalid file type")

        # Use the directory manager to list contents
        contents = await dir_manager.list_directory(path)
        
        return {
            "current_path": path,
            "items": contents
        }
        
    except HTTPException:
        raise
    except Exception as e:
        error_class = e.__class__.__name__
        error_msg = str(e)
        log(LogLevel.ERROR, f"Error listing directory - Class: {error_class}, Message: {error_msg}")
        raise HTTPException(status_code=500, detail=f"Failed to list directory: {error_class} - {error_msg}")

@router.post("/{file_type}/create", response_model=dict)
async def create_directory(
    path: str,
    file_type: str = FastAPIPath(..., regex="^(chat|document|prompt)$")
):
    """Create a new directory relative to the type-specific base directory."""
    try:
        dir_manager = TYPE_TO_MANAGER.get(file_type)
        if not dir_manager:
            log(LogLevel.ERROR, f"Invalid file type: {file_type}")
            raise HTTPException(status_code=400, detail="Invalid file type")
            
        return await dir_manager.create_directory(path)
        
    except HTTPException:
        raise
    except Exception as e:
        log(LogLevel.ERROR, f"Failed to create directory: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{file_type}/delete/{path:path}", response_model=dict)
async def delete_directory(
    path: str,
    file_type: str = FastAPIPath(..., regex="^(chat|document|prompt)$")
):
    """Delete an empty directory relative to the type-specific base directory."""
    try:
        dir_manager = TYPE_TO_MANAGER.get(file_type)
        if not dir_manager:
            log(LogLevel.ERROR, f"Invalid file type: {file_type}")
            raise HTTPException(status_code=400, detail="Invalid file type")
            
        return await dir_manager.delete_directory(path)
        
    except HTTPException:
        raise
    except Exception as e:
        error_class = e.__class__.__name__
        error_msg = str(e)
        log(LogLevel.ERROR, f"Error deleting directory - Class: {error_class}, Message: {error_msg}")
        raise HTTPException(status_code=500, detail=f"Failed to delete directory: {error_class} - {error_msg}")