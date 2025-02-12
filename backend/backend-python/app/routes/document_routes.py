from fastapi import APIRouter, HTTPException
from pathlib import Path
from utils.logging import log, LogLevel

router = APIRouter()

# Create a documents directory next to the chats directory
DOCUMENTS_DIR = Path("user-data/documents")
DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/load_document")
async def load_document(filename: str):
    try:
        # Sanitize filename and ensure it has an extension
        filename = filename.strip()
        if not any(filename.endswith(ext) for ext in ['.txt', '.md']):
            filename += '.md'  # Default to markdown
            
        # Prevent path traversal
        if "/" in filename or "\\" in filename:
            raise ValueError("Invalid filename")
            
        file_path = DOCUMENTS_DIR / filename
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Document not found")
            
        with open(file_path, "r", encoding='utf-8') as f:
            content = f.read()
            
        log(LogLevel.MINIMUM, f"📄 Loaded document: {filename}")
        return {"content": content}
        
    except Exception as e:
        log(LogLevel.MINIMUM, f"📄 Error loading document: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))