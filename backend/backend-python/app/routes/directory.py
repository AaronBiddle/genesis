from fastapi import APIRouter, HTTPException, Query
from pathlib import Path
import os
from utils.logging import log, LogLevel, LogPrefix
from services.file_services import CHATS_DIR, DOCUMENTS_DIR, PROMPTS_DIR

router = APIRouter(prefix="/directory")

# Map file types to their base directories
TYPE_TO_DIR = {
    'chat': CHATS_DIR,
    'document': DOCUMENTS_DIR,
    'prompt': PROMPTS_DIR
}

def is_safe_path(path: Path, base_dir: Path) -> bool:
    """Check if the path is safe (within base directory)"""
    try:
        resolved_path = path.resolve()
        resolved_base = base_dir.resolve()
        return resolved_path == resolved_base or resolved_base in resolved_path.parents
    except (TypeError, ValueError):
        return False

@router.get("/list", response_model=dict)
@router.get("/list/{path:path}", response_model=dict)
async def list_directory(
    path: str = "",
    type: str = Query(..., regex="^(chat|document|prompt)$")  # Required query parameter
):
    """List contents of a directory relative to type-specific base directory"""
    try:
        # Get the appropriate base directory for the file type
        base_dir = TYPE_TO_DIR.get(type)
        if not base_dir:
            raise HTTPException(status_code=400, detail="Invalid file type")

        # Construct full path
        full_path = base_dir / path
        
        # Ensure path is within base directory
        if not is_safe_path(full_path, base_dir):
            raise HTTPException(status_code=403, detail="Access denied")
            
        # Ensure directory exists
        if not full_path.exists() or not full_path.is_dir():
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
                log(LogLevel.ERROR, f"Error processing item {item}: {str(e)}", LogPrefix.ERROR)
                continue
            
        return {
            "current_path": path,
            "items": sorted(contents, key=lambda x: (x["type"] == "file", x["name"]))
        }
        
    except HTTPException:
        raise
    except Exception as e:
        log(LogLevel.ERROR, f"Error listing directory: {str(e)}", LogPrefix.ERROR)
        raise HTTPException(status_code=500, detail=str(e)) 