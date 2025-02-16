from pathlib import Path
from fastapi import HTTPException
from typing import List
from utils.logging import log, LogLevel, LogPrefix

class FileManager:
    def __init__(self, base_dir: Path, extension: str, file_type: str):
        """
        Initialize file manager for a specific type of files
        
        Args:
            base_dir: Base directory for files
            extension: File extension (e.g., '.json', '.md', '.txt')
            file_type: Type of files for logging (e.g., 'chat', 'document', 'prompt')
        """
        self.base_dir = base_dir
        self.extension = extension
        self.file_type = file_type
        try:
            self.base_dir.mkdir(parents=True, exist_ok=True)
        except Exception as e:
            log(LogLevel.MINIMUM, f"Error creating directory {self.base_dir}: {str(e)}")
            raise

    def _ensure_extension(self, filename: str) -> str:
        """Add extension if not present"""
        return filename if filename.endswith(self.extension) else f"{filename}{self.extension}"

    def _get_file_path(self, filename: str) -> Path:
        """Get full path for a file"""
        filename = self._ensure_extension(filename)
        return self.base_dir / filename

    async def save(self, filename: str, content: dict | str) -> dict:
        """Save content to a file"""
        try:
            file_path = self._get_file_path(filename)
            
            if isinstance(content, dict):
                import json
                with open(file_path, 'w') as f:
                    json.dump(content, f, indent=2)
            else:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                    
            log(LogLevel.DEBUGGING, f"Saved {self.file_type} to {file_path}", LogPrefix.FILE)
            return {"filename": filename}
            
        except Exception as e:
            log(LogLevel.ERROR, f"Error saving {self.file_type}: {str(e)}", LogPrefix.ERROR)
            raise HTTPException(status_code=500, detail=str(e))

    async def load(self, filename: str) -> dict | str:
        """Load content from a file"""
        try:
            file_path = self._get_file_path(filename)
            
            if not file_path.exists():
                raise HTTPException(status_code=404, detail=f"File not found: {filename}")
            
            if self.extension == '.json':
                import json
                with open(file_path, 'r') as f:
                    return json.load(f)
            else:
                with open(file_path, 'r', encoding='utf-8') as f:
                    return f.read()
                    
        except HTTPException:
            raise
        except Exception as e:
            log(LogLevel.ERROR, f"Error loading {self.file_type}: {str(e)}", LogPrefix.ERROR)
            raise HTTPException(status_code=500, detail=str(e))

    async def delete(self, filename: str) -> dict:
        """Delete a file"""
        try:
            file_path = self._get_file_path(filename)
            
            if not file_path.exists():
                raise HTTPException(status_code=404, detail=f"File not found: {filename}")
                
            file_path.unlink()
            log(LogLevel.DEBUGGING, f"Deleted {self.file_type}: {filename}", LogPrefix.FILE)
            return {"message": f"Successfully deleted {filename}"}
            
        except HTTPException:
            raise
        except Exception as e:
            log(LogLevel.ERROR, f"Error deleting {self.file_type}: {str(e)}", LogPrefix.ERROR)
            raise HTTPException(status_code=500, detail=str(e))

    async def list_files(self) -> List[str]:
        """List all files with the specified extension"""
        try:            
            pattern = f"*{self.extension}"
            
            files = [f.name for f in self.base_dir.glob(pattern)]
            
            return sorted(files)
            
        except Exception as e:
            log(LogLevel.ERROR, f"Error in list_files: {str(e)}", LogPrefix.ERROR)
            raise 