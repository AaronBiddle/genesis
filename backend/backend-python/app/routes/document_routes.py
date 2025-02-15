from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from pathlib import Path
from utils.logging import log, LogLevel, LogPrefix
from enum import Enum
from typing import List
from os import getenv
from dotenv import load_dotenv

load_dotenv()

# Base user data directory
USER_DATA_DIR = Path(getenv('USER_DATA_DIR', '/user-data'))

# Specific directories for each file type
DOCUMENTS_DIR = Path(getenv('DOCUMENTS_DIR', USER_DATA_DIR / 'documents'))
CHATS_DIR = Path(getenv('CHATS_DIR', USER_DATA_DIR / 'chats'))
PROMPTS_DIR = Path(getenv('PROMPTS_DIR', USER_DATA_DIR / 'prompts'))

# Create all directories at startup
for directory in [DOCUMENTS_DIR, CHATS_DIR, PROMPTS_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

router = APIRouter()

class DocumentRequest(BaseModel):
    filename: str

class SaveDocumentRequest(BaseModel):
    filename: str
    content: str

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

class FileType(Enum):
    DOCUMENT = "document"
    CHAT = "chat"
    PROMPT = "prompt"

@router.get("/list_files/{file_type}")
async def list_files(file_type: FileType) -> dict[str, List[str]]:
    try:
        base_dir = {
            FileType.DOCUMENT: DOCUMENTS_DIR,
            FileType.CHAT: CHATS_DIR,
            FileType.PROMPT: PROMPTS_DIR  # You would need to define this constant
        }[file_type]
        
        extensions = {
            FileType.DOCUMENT: ["*.txt", "*.md"],
            FileType.CHAT: ["*.json"],
            FileType.PROMPT: ["*.txt", "*.md"]  # Define whatever extensions you want for prompts
        }[file_type]
        
        base_dir.mkdir(parents=True, exist_ok=True)
        files = []
        for ext in extensions:
            files.extend([f.name for f in base_dir.glob(ext)])
            
        log(LogLevel.DEBUGGING, f"📄 Found {file_type.value} files: {files}", LogPrefix.FILE)
        return {"files": files}
        
    except Exception as e:
        log(LogLevel.MINIMUM, f"Error listing {file_type.value} files: {str(e)}", LogPrefix.ERROR)
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/delete_file/{file_type}/{filename}")
async def delete_file(file_type: FileType, filename: str):
    try:
        base_dir = {
            FileType.DOCUMENT: DOCUMENTS_DIR,
            FileType.CHAT: CHATS_DIR,
            FileType.PROMPT: PROMPTS_DIR
        }[file_type]
        
        # Prevent path traversal
        if "/" in filename or "\\" in filename:
            raise ValueError("Invalid filename")
            
        file_path = base_dir / filename
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"File not found: {filename}")
            
        file_path.unlink()  # Delete the file
        log(LogLevel.DEBUGGING, f"📄 Deleted {file_type.value} file: {filename}", LogPrefix.FILE)
        return {"status": "success", "deleted": filename}
        
    except Exception as e:
        log(LogLevel.MINIMUM, f"Error deleting {file_type.value} file: {str(e)}", LogPrefix.ERROR)
        raise HTTPException(status_code=400, detail=str(e))