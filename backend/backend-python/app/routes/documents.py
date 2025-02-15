from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pathlib import Path
from utils.logging import log, LogLevel, LogPrefix
from .file_management.directory_handler import DirectoryManager
from os import getenv
from typing import List
import os

router = APIRouter(prefix="/documents")

# Use USER_DATA_DIR as base for DOCUMENTS_DIR
USER_DATA_DIR = Path(os.getenv('USER_DATA_DIR', '/user-data'))
DOCUMENTS_DIR = Path(os.getenv('DOCUMENTS_DIR', USER_DATA_DIR / 'documents'))

# Initialize directory manager
doc_manager = DirectoryManager(
    allowed_extensions=['.md', '.txt'],
    base_path=DOCUMENTS_DIR
)

class DocumentRequest(BaseModel):
    filename: str

class SaveDocumentRequest(BaseModel):
    filename: str
    content: str

class LoadDocumentRequest(BaseModel):
    filename: str

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
        doc_files = list(DOCUMENTS_DIR.glob("*"))
        response = {
            "files": [doc.name for doc in doc_files if doc.name != ".gitkeep"]
        }
        log(LogLevel.DEBUGGING, f"Returning document files: {response}")
        return response
    except Exception as e:
        log(LogLevel.ERROR, f"Error listing documents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/load")
async def load_document(request: LoadDocumentRequest):
    """Load a document from a file"""
    try:
        file_path = DOCUMENTS_DIR / request.filename
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"Document {request.filename} not found")
        
        with open(file_path, 'r') as f:
            content = f.read()
            log(LogLevel.DEBUGGING, f"Loaded document: {len(content)} bytes")
            return {"content": content}
            
    except HTTPException:
        raise
    except Exception as e:
        log(LogLevel.ERROR, f"Error loading document: {str(e)}")
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