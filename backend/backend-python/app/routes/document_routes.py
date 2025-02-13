from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from pathlib import Path
from utils.logging import log, LogLevel, LogPrefix

router = APIRouter()

class DocumentRequest(BaseModel):
    filename: str

class SaveDocumentRequest(BaseModel):
    filename: str
    content: str

# Create a documents directory next to the chats directory
DOCUMENTS_DIR = Path("/user-data/documents")
DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/load_document")
async def load_document(request: DocumentRequest):
    try:
        log(LogLevel.DEBUGGING, f"📄 Attempting to load document: {request.filename}")
        
        # Sanitize filename and ensure it has an extension
        filename = request.filename.strip()
        if not any(filename.endswith(ext) for ext in ['.txt', '.md']):
            filename += '.md'  # Default to markdown
        
        log(LogLevel.DEBUGGING, f"📄 Sanitized filename: {filename}")
            
        # Prevent path traversal
        if "/" in filename or "\\" in filename:
            raise ValueError("Invalid filename")
            
        file_path = DOCUMENTS_DIR / filename
        log(LogLevel.DEBUGGING, f"📄 Looking for file at: {file_path}")
        
        if not file_path.exists():
            log(LogLevel.DEBUGGING, f"📄 File not found: {file_path}")
            raise HTTPException(status_code=404, detail=f"Document not found: {filename}")
            
        with open(file_path, "r", encoding='utf-8') as f:
            content = f.read()
            
        log(LogLevel.DEBUGGING, f"📄 Successfully loaded document: {filename}")
        return {"content": content}
        
    except Exception as e:
        log(LogLevel.DEBUGGING, f"📄 Error loading document: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/save_document")
async def save_document(request: SaveDocumentRequest):
    try:
        log(LogLevel.DEBUGGING, f"Attempting to save document: {request.filename}", LogPrefix.FILE)
        
        # Sanitize filename and ensure it has an extension
        filename = request.filename.strip()
        if not any(filename.endswith(ext) for ext in ['.txt', '.md']):
            filename += '.md'  # Default to markdown
            
        # Prevent path traversal
        if "/" in filename or "\\" in filename:
            raise ValueError("Invalid filename")
            
        file_path = DOCUMENTS_DIR / filename
        
        with open(file_path, "w", encoding='utf-8') as f:
            f.write(request.content)
            
        log(LogLevel.DEBUGGING, f"Successfully saved document: {filename}", LogPrefix.FILE)
        return {"message": "Document saved successfully"}
        
    except Exception as e:
        log(LogLevel.DEBUGGING, f"Error saving document: {str(e)}", LogPrefix.ERROR)
        raise HTTPException(status_code=400, detail=str(e))