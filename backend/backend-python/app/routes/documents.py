from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from utils.logging import log, LogLevel
from services.file_services import document_manager

router = APIRouter(prefix="/documents")

class DocumentRequest(BaseModel):
    filename: str

class SaveDocumentRequest(BaseModel):
    filename: str
    content: str

@router.post("/save")
async def save_document(request: SaveDocumentRequest):
    """Save a document to a file"""
    try:
        log(LogLevel.TEMPORARY, f"Attempting to save document: {request.filename}")
        return await document_manager.save(request.filename, request.content)
            
    except Exception as e:
        log(LogLevel.ERROR, f"Error saving document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def list_documents():
    """List all available document files"""
    try:
        files = await document_manager.list_files()
        return {"files": files}
    except Exception as e:
        log(LogLevel.ERROR, f"Error listing documents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/load")
async def load_document(request: DocumentRequest):
    """Load a document from a file"""
    try:
        log(LogLevel.TEMPORARY, f"Loading document: {request.filename}")
        content = await document_manager.load(request.filename)
        return {"content": content}
    except Exception as e:
        log(LogLevel.ERROR, f"Error loading document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/delete/{filename:path}")
async def delete_document(filename: str):
    """Delete a document file using the standard DELETE method."""
    try:
        log(LogLevel.TEMPORARY, f"Deleting document: {filename}")
        return await document_manager.delete(filename)
    except Exception as e:
        log(LogLevel.ERROR, f"Error deleting document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 