from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pathlib import Path
from utils.logging import log, LogLevel, LogPrefix
from .file_management.directory_handler import DirectoryManager
from os import getenv
from typing import List

router = APIRouter(prefix="/documents")

# Initialize directory manager
DOCUMENTS_DIR = Path(getenv('DOCUMENTS_DIR', '/user-data/documents'))
doc_manager = DirectoryManager(
    allowed_extensions=['.md', '.txt'],
    base_path=DOCUMENTS_DIR
)

class DocumentRequest(BaseModel):
    filename: str

class SaveDocumentRequest(BaseModel):
    filename: str
    content: str

@router.post("/load_document")
async def load_document(request: DocumentRequest):
    try:
        log(LogLevel.DEBUGGING, f"📄 Attempting to load document: {request.filename}")
        
        file_path = doc_manager.validate_filename(request.filename)
        doc_manager.ensure_file_exists(file_path)
        
        with open(file_path, "r", encoding='utf-8') as f:
            content = f.read()
            
        log(LogLevel.DEBUGGING, f"📄 Successfully loaded document: {request.filename}")
        return {"content": content}
        
    except Exception as e:
        log(LogLevel.DEBUGGING, f"📄 Error loading document: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/save_document")
async def save_document(request: SaveDocumentRequest):
    try:
        log(LogLevel.DEBUGGING, f"Attempting to save document: {request.filename}", LogPrefix.FILE)
        
        file_path = doc_manager.validate_filename(request.filename)
        
        with open(file_path, "w", encoding='utf-8') as f:
            f.write(request.content)
            
        log(LogLevel.DEBUGGING, f"Successfully saved document: {request.filename}", LogPrefix.FILE)
        return {"message": "Document saved successfully"}
        
    except Exception as e:
        log(LogLevel.DEBUGGING, f"Error saving document: {str(e)}", LogPrefix.ERROR)
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/list")
async def list_documents():
    """List all available document files"""
    try:
        # Get all files from the documents directory
        doc_files = list(Path("user-data/documents").glob("*"))
        # Filter out .gitkeep and return filenames
        return {
            "files": [doc.name for doc in doc_files if doc.name != ".gitkeep"]
        }
    except Exception as e:
        log(LogLevel.ERROR, f"Error listing documents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/delete_document/{filename}")
async def delete_document(filename: str):
    try:
        file_path = doc_manager.validate_filename(filename)
        doc_manager.ensure_file_exists(file_path)
        
        file_path.unlink()  # Delete the file
        log(LogLevel.DEBUGGING, f"📄 Deleted document: {filename}", LogPrefix.FILE)
        return {"status": "success", "deleted": filename}
        
    except Exception as e:
        log(LogLevel.MINIMUM, f"Error deleting document: {str(e)}", LogPrefix.ERROR)
        raise HTTPException(status_code=400, detail=str(e)) 