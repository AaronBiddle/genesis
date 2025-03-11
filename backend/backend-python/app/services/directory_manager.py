# services/directory_manager.py
from pathlib import Path
from fastapi import HTTPException
from typing import List, Dict, Any
from utils.logging import log, LogLevel

class DirectoryManager:
    def __init__(self, base_dir: Path, file_type: str):
        """
        Initialize directory manager for a specific type of content
        
        Args:
            base_dir: Base directory
            file_type: Type of content for logging (e.g., 'chat', 'document', 'prompt')
        """
        self.base_dir = base_dir
        self.file_type = file_type
        try:
            self.base_dir.mkdir(parents=True, exist_ok=True)
        except Exception as e:
            log(LogLevel.MINIMUM, f"Error creating directory {self.base_dir}: {str(e)}")
            raise

    def _get_dir_path(self, path: str) -> Path:
        """Get full path for a directory and ensure it's safe"""
        full_path = self.base_dir / path
        
        # Resolve both paths to their absolute form
        try:
            resolved_path = full_path.resolve()
            resolved_base = self.base_dir.resolve()
            
            # Check if path is safe
            if not (resolved_path == resolved_base or resolved_base in resolved_path.parents):
                log(LogLevel.ERROR, f"Access denied for path: {full_path}")
                raise ValueError("Access denied: attempted directory traversal")
            
            return full_path
        
        except (TypeError, ValueError, RuntimeError) as e:
            log(LogLevel.ERROR, f"Error resolving path: {str(e)}")
            raise ValueError(f"Invalid path: {str(e)}")

    async def list_directory(self, path: str = "") -> List[Dict[str, Any]]:
        """List contents of a directory"""
        try:
            dir_path = self._get_dir_path(path)
            
            if not dir_path.exists() or not dir_path.is_dir():
                raise HTTPException(status_code=404, detail="Directory not found")
                
            contents = []
            for item in dir_path.iterdir():
                if item.name == '.gitkeep':
                    continue
                    
                contents.append({
                    "name": item.name,
                    "type": "directory" if item.is_dir() else "file",
                    "path": str(item.relative_to(self.base_dir))
                })
                
            return sorted(contents, key=lambda x: (x["type"] == "file", x["name"]))
            
        except HTTPException:
            raise
        except Exception as e:
            log(LogLevel.ERROR, f"Error listing directory: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    async def create_directory(self, path: str) -> Dict[str, str]:
        """Create a new directory"""
        try:
            dir_path = self._get_dir_path(path)
            dir_path.mkdir(parents=True, exist_ok=True)
            
            log(LogLevel.DEBUGGING, f"Directory created: {dir_path}")
            return {"message": f"Created directory {path}"}
            
        except Exception as e:
            log(LogLevel.ERROR, f"Error creating directory: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    async def delete_directory(self, path: str) -> Dict[str, str]:
        """Delete an empty directory"""
        try:
            dir_path = self._get_dir_path(path)
            
            if not dir_path.exists() or not dir_path.is_dir():
                raise HTTPException(status_code=404, detail="Directory not found")
            
            # Check if directory is empty (excluding .gitkeep)
            contents = [item for item in dir_path.iterdir() if item.name != '.gitkeep']
            if contents:
                raise HTTPException(status_code=400, detail="Directory must be empty to delete")
                
            # Remove .gitkeep if it exists
            gitkeep = dir_path / '.gitkeep'
            if gitkeep.exists():
                gitkeep.unlink()
                
            dir_path.rmdir()
            
            log(LogLevel.DEBUGGING, f"Directory deleted: {dir_path}")
            return {"message": "Directory deleted successfully"}
            
        except HTTPException:
            raise
        except Exception as e:
            log(LogLevel.ERROR, f"Error deleting directory: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))