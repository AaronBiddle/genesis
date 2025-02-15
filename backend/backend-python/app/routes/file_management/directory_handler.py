from pathlib import Path
from typing import List
from fastapi import HTTPException
from utils.logging import log, LogLevel, LogPrefix

class DirectoryManager:
    def __init__(self, allowed_extensions: List[str], base_path: Path):
        self.allowed_extensions = allowed_extensions
        self.base_path = base_path
        self.base_path.mkdir(parents=True, exist_ok=True)

    def validate_filename(self, filename: str) -> Path:
        """Validates and returns the full path for a filename."""
        filename = filename.strip()
        
        # Add default extension if none provided
        if not any(filename.endswith(ext) for ext in self.allowed_extensions):
            filename += self.allowed_extensions[0]  # Add first allowed extension as default
            
        # Prevent path traversal
        if "/" in filename or "\\" in filename:
            raise ValueError("Invalid filename")
            
        return self.base_path / filename

    def ensure_file_exists(self, file_path: Path) -> None:
        """Checks if file exists, raises HTTPException if not."""
        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"File not found: {file_path.name}")

    def list_files(self) -> List[str]:
        """Lists all files with allowed extensions in the directory."""
        files = []
        for ext in self.allowed_extensions:
            files.extend([f.name for f in self.base_path.glob(f"*{ext}")])
        return sorted(files) 