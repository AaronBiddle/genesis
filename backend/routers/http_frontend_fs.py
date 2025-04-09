'''API routes for frontend file system operations.'''

from fastapi import APIRouter, HTTPException, Query, Body, status
from pydantic import BaseModel, Field
from typing import List, Dict, Literal
# Removed direct os, shutil imports as logic moved to service
import logging

# Import the service functions
from backend.services import file_operations

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# --- Pydantic Models for Request Bodies ---

class PathPayload(BaseModel):
    mount: str = Field(..., description="The mount point name (e.g., 'userdata/')")
    path: str = Field(..., description="The path relative to the mount point (e.g., 'myfile.txt')")

class WriteFilePayload(PathPayload):
    content: str = Field(..., description="The content to write to the file.")

class CreateDirectoryPayload(BaseModel):
    path: str = Field(..., description="The user-facing path (e.g., userdata/new_dir/) to create.")

# --- Helper Functions Removed (moved to service) ---

# --- API Endpoints (Simplified to call service layer) ---

@router.get("/read", response_model=str)
async def read_file_endpoint(payload: PathPayload = Body(...)):
    """Reads the content of a specified file via the service layer."""
    logger.info(f"Router received request to read file: {payload.mount}{payload.path}")
    return file_operations.perform_read_file(payload.mount, payload.path)

@router.post("/write", status_code=status.HTTP_201_CREATED)
async def write_file_endpoint(payload: WriteFilePayload = Body(...)):
    """Writes content to a specified file via the service layer."""
    logger.info(f"Router received request to write file: {payload.mount}{payload.path}")
    return file_operations.perform_write_file(payload.mount, payload.path, payload.content)

@router.delete("/delete", status_code=status.HTTP_200_OK)
async def delete_file_endpoint(payload: PathPayload = Body(...)):
    """Deletes a specified file via the service layer."""
    logger.info(f"Router received request to delete file: {payload.mount}{payload.path}")
    return file_operations.perform_delete_file(payload.mount, payload.path)

@router.put("/create_dir", status_code=status.HTTP_201_CREATED)
async def create_directory_endpoint(payload: PathPayload = Body(...)):
    """Creates a new directory via the service layer."""
    logger.info(f"Router received request to create directory: {payload.mount}{payload.path}")
    return file_operations.perform_create_directory(payload.mount, payload.path)

# Define the response model for list_directory based on service output
class FileSystemItem(BaseModel):
    name: str
    path: str # User-facing path
    type: Literal['file', 'directory']

@router.get("/list_dir", response_model=List[FileSystemItem]) 
async def list_directory_endpoint(payload: PathPayload = Body(...)):
    """Lists the contents of a specified directory via the service layer."""
    logger.info(f"Router received request to list directory: {payload.mount}{payload.path}")
    return file_operations.perform_list_directory(payload.mount, payload.path)

@router.delete("/delete_dir", status_code=status.HTTP_200_OK)
async def delete_directory_endpoint(payload: PathPayload = Body(...)):
    """Deletes a specified empty directory via the service layer."""
    logger.info(f"Router received request to delete directory: {payload.mount}{payload.path}")
    return file_operations.perform_delete_directory(payload.mount, payload.path)

# Define the response model for mounts based on service output
class MountPointInfo(BaseModel):
    name: str
    path: str # Keeping internal path here, maybe filter later if needed
    access: Literal['readonly', 'readwrite']

@router.get("/mounts", response_model=List[MountPointInfo])
async def get_mounts_endpoint():
    """Retrieves the list of available mount points from the service layer."""
    logger.info("Router received request to get mounts")
    # Delegate to the service layer
    # Note: The service currently returns raw mount info including absolute paths.
    # Consider creating a filtered DTO if exposing absolute paths is undesirable.
    return file_operations.get_mount_info()

# --- Endpoints End --- 