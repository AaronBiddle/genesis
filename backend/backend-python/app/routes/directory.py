from fastapi import APIRouter, HTTPException, Query
from pathlib import Path
import os
from utils.logging import log, LogLevel
from services.file_services import CHATS_DIR, DOCUMENTS_DIR, PROMPTS_DIR

router = APIRouter(prefix="/directory")

# Map file types to their base directories
TYPE_TO_DIR = {
    'chat': CHATS_DIR,
    'document': DOCUMENTS_DIR,
    'prompt': PROMPTS_DIR
}

def is_safe_path(path: Path, base_dir: Path) -> bool:
    """
    Check if the path is safe (within base directory).
    Handles '..' and '.' in paths explicitly.
    """
    try:
        # Resolve both paths to their absolute form (resolves symlinks too)
        resolved_path = path.resolve()
        resolved_base = base_dir.resolve()

        # Convert to strings for easier comparison
        str_path = str(resolved_path)
        str_base = str(resolved_base)

        # Check if path starts with base_dir
        # This prevents both '..' traversal and symlink tricks
        return str_path.startswith(str_base)
    except (TypeError, ValueError, RuntimeError) as e:
        log(LogLevel.TEMPORARY, f"Path safety check failed with error: {e}")
        return False

@router.get("/list", response_model=dict)
@router.get("/list/{path:path}", response_model=dict)
async def list_directory(
    path: str = "",
    file_type: str = Query(..., regex="^(chat|document|prompt)$")
):
    """List contents of a directory relative to type-specific base directory"""
    try:
        # Get the appropriate base directory for the file type
        base_dir = TYPE_TO_DIR.get(file_type)
        if not base_dir:
            log(LogLevel.ERROR, f"Invalid file type: {file_type}")
            raise HTTPException(status_code=400, detail="Invalid file type")

        # Construct full path
        full_path = base_dir / path if base_dir else None
        
        # DEBUG: Print the full path for debugging
        log(LogLevel.DEBUGGING, f"DEBUG - list_directory - base_dir: {base_dir}, path: {path}, full_path: {full_path}")
        
        if not full_path:
            raise ValueError(f"Could not construct path from base_dir: {base_dir} and path: {path}")
            
        # Ensure path is within base directory
        if not is_safe_path(full_path, base_dir):
            log(LogLevel.ERROR, f"Access denied for path: {full_path}")
            raise HTTPException(status_code=403, detail="Access denied")
            
        # Ensure directory exists
        if not full_path.exists() or not full_path.is_dir():
            log(LogLevel.ERROR, f"Directory not found: {full_path}")
            raise HTTPException(status_code=404, detail="Directory not found")
            
        # Get directory contents
        contents = []
        for item in full_path.iterdir():
            try:
                contents.append({
                    "name": item.name,
                    "type": "directory" if item.is_dir() else "file",
                    "path": str(item.relative_to(base_dir))
                })
            except Exception as e:
                error_class = e.__class__.__name__
                log(LogLevel.ERROR, f"Error processing item {item}: {error_class}: {str(e)}")
                continue
            
        return {
            "current_path": path,
            "items": sorted(contents, key=lambda x: (x["type"] == "file", x["name"]))
        }
        
    except HTTPException:
        raise
    except Exception as e:
        error_class = e.__class__.__name__
        error_msg = str(e)
        log(LogLevel.ERROR, f"Error listing directory - Class: {error_class}, Message: {error_msg}")
        raise HTTPException(status_code=500, detail=f"Failed to list directory: {error_class} - {error_msg}")

@router.post("/create", response_model=dict)
async def create_directory(
    path: str = Query(...),
    file_type: str = Query(..., regex="^(chat|document|prompt)$")
):
    """Create a new directory relative to the type-specific base directory."""
    try:
        base_dir = TYPE_TO_DIR.get(file_type)
        if not base_dir:
            log(LogLevel.ERROR, f"Invalid file type: {file_type}")
            raise HTTPException(status_code=400, detail="Invalid file type")
        new_dir = base_dir / path
        new_dir.mkdir(parents=True, exist_ok=True)
        log(LogLevel.DEBUGGING, f"Directory created: {new_dir}")
        return {"message": f"Created directory {str(new_dir)}"}
    except Exception as e:
        log(LogLevel.ERROR, f"Failed to create directory: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/delete/{path:path}", response_model=dict)
async def delete_directory(
    path: str,
    file_type: str = Query(..., regex="^(chat|document|prompt)$")
):
    """Delete an empty directory relative to the type-specific base directory."""
    try:
        # Get the appropriate base directory for the file type
        base_dir = TYPE_TO_DIR.get(file_type)
        if not base_dir:
            log(LogLevel.ERROR, f"Invalid file type: {file_type}")
            raise HTTPException(status_code=400, detail="Invalid file type")

        # Construct full path
        dir_path = base_dir / path if base_dir else None
        
        log(LogLevel.DEBUGGING, f"DEBUG - delete_directory - base_dir: {base_dir}, path: {path}, dir_path: {dir_path}")
        
        if not dir_path:
            raise ValueError(f"Could not construct path from base_dir: {base_dir} and path: {path}")
            
        # Ensure path is within base directory
        if not is_safe_path(dir_path, base_dir):
            log(LogLevel.ERROR, f"Access denied for path: {dir_path}")
            raise HTTPException(status_code=403, detail="Access denied")
            
        # Ensure directory exists
        if not dir_path.exists() or not dir_path.is_dir():
            log(LogLevel.ERROR, f"Directory not found: {dir_path}")
            raise HTTPException(status_code=404, detail="Directory not found")
        
        # Check if directory is empty
        if any(dir_path.iterdir()):
            log(LogLevel.ERROR, f"Directory not empty: {dir_path}")
            raise HTTPException(status_code=400, detail="Directory must be empty to delete")
            
        # Delete the directory
        dir_path.rmdir()
        
        log(LogLevel.DEBUGGING, f"Directory deleted: {dir_path}")
        return {"status": "success", "message": "Directory deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        error_class = e.__class__.__name__
        error_msg = str(e)
        log(LogLevel.ERROR, f"Error deleting directory - Class: {error_class}, Message: {error_msg}")
        raise HTTPException(status_code=500, detail=f"Failed to delete directory: {error_class} - {error_msg}") 