import os
import json
import base64
from pathlib import Path
import logging
from PIL import Image
import io
from typing import Dict, List, Any, Optional, Union

# Base handler class (should match your worker.py BaseHandler)
class BaseHandler:
    def process(self, params, progress_callback=None):
        raise NotImplementedError("Handlers must implement process()")

class FileSystemHandler(BaseHandler):
    """Base class for file system operations in the worker environment"""
    
    def __init__(self, base_dirs=None):
        """
        Initialize with base directories for different file types
        
        Args:
            base_dirs: Dictionary mapping file types to base directories
                       If None, will use default locations
        """
        # Default base directories - adjust these to match your worker environment
        self.base_dirs = base_dirs or {
            'chat': Path(os.getenv('WORKER_CHATS_DIR', Path.home() / 'worker-data' / 'chats')),
            'document': Path(os.getenv('WORKER_DOCUMENTS_DIR', Path.home() / 'worker-data' / 'documents')),
            'prompt': Path(os.getenv('WORKER_PROMPTS_DIR', Path.home() / 'worker-data' / 'prompts')),
            'image': Path(os.getenv('WORKER_IMAGES_DIR', Path.home() / 'worker-data' / 'images')),
        }
        
        # Create base directories if they don't exist
        for dir_path in self.base_dirs.values():
            dir_path.mkdir(parents=True, exist_ok=True)
    
    def get_base_dir(self, file_type):
        """Get the base directory for a file type"""
        if file_type not in self.base_dirs:
            raise ValueError(f"Unknown file type: {file_type}")
        return self.base_dirs[file_type]
    
    def is_safe_path(self, path, base_dir):
        """Check if a path is safe (doesn't escape the base directory)"""
        try:
            # Resolve both paths to their absolute form
            resolved_path = path.resolve()
            resolved_base = base_dir.resolve()
            
            # Check if path is within base directory
            return str(resolved_path).startswith(str(resolved_base))
        except Exception as e:
            logging.error(f"Path safety check failed: {str(e)}")
            return False

class ListDirectoryHandler(FileSystemHandler):
    """Handler for listing directory contents"""
    
    def process(self, params, progress_callback=None):
        """
        List contents of a directory
        
        Args:
            params: Dictionary with:
                - file_type: Type of files (chat, document, prompt, image)
                - path: Relative path to list (optional)
            progress_callback: Function to report progress
            
        Returns:
            Dictionary with directory contents
        """
        try:
            file_type = params.get('file_type')
            path = params.get('path', '')
            
            if not file_type:
                raise ValueError("Missing required parameter: file_type")
            
            base_dir = self.get_base_dir(file_type)
            full_path = base_dir / path if path else base_dir
            
            if progress_callback:
                progress_callback(f"Listing directory: {full_path}")
            
            # Ensure path is safe
            if not self.is_safe_path(full_path, base_dir):
                raise ValueError(f"Access denied for path: {full_path}")
            
            # Ensure directory exists
            if not full_path.exists() or not full_path.is_dir():
                raise ValueError(f"Directory not found: {full_path}")
            
            # Get directory contents
            contents = []
            for item in full_path.iterdir():
                try:
                    contents.append({
                        "name": item.name,
                        "type": "directory" if item.is_dir() else "file",
                        "path": str(item.relative_to(base_dir)),
                        "size": os.path.getsize(item) if item.is_file() else None,
                        "modified": os.path.getmtime(item)
                    })
                except Exception as e:
                    logging.error(f"Error processing item {item}: {str(e)}")
                    continue
            
            return {
                "current_path": path,
                "items": sorted(contents, key=lambda x: (x["type"] == "file", x["name"]))
            }
            
        except Exception as e:
            logging.error(f"Error listing directory: {str(e)}")
            raise

class LoadFileHandler(FileSystemHandler):
    """Handler for loading files"""
    
    def process(self, params, progress_callback=None):
        """
        Load a file
        
        Args:
            params: Dictionary with:
                - file_type: Type of file (chat, document, prompt, image)
                - filename: Name of file to load
            progress_callback: Function to report progress
            
        Returns:
            Dictionary with file content
        """
        try:
            file_type = params.get('file_type')
            filename = params.get('filename')
            
            if not file_type or not filename:
                raise ValueError("Missing required parameters: file_type and filename")
            
            base_dir = self.get_base_dir(file_type)
            file_path = base_dir / filename
            
            if progress_callback:
                progress_callback(f"Loading file: {file_path}")
            
            # Ensure path is safe
            if not self.is_safe_path(file_path, base_dir):
                raise ValueError(f"Access denied for path: {file_path}")
            
            # Ensure file exists
            if not file_path.exists() or not file_path.is_file():
                raise ValueError(f"File not found: {file_path}")
            
            # Load file based on type
            if file_type == 'image':
                # For images, load with PIL and convert to base64
                try:
                    image = Image.open(file_path)
                    buffered = io.BytesIO()
                    image.save(buffered, format=image.format or "JPEG")
                    img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
                    
                    return {
                        "filename": filename,
                        "content_type": f"image/{image.format.lower() if image.format else 'jpeg'}",
                        "width": image.width,
                        "height": image.height,
                        "data": img_str
                    }
                except Exception as e:
                    raise ValueError(f"Failed to load image: {str(e)}")
            
            elif file_type == 'chat':
                # For chats, load JSON
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = json.load(f)
                    return {
                        "filename": filename,
                        "content": content
                    }
                except json.JSONDecodeError:
                    raise ValueError("Invalid JSON format in chat file")
            
            else:
                # For documents and prompts, load as text
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                return {
                    "filename": filename,
                    "content": content
                }
                
        except Exception as e:
            logging.error(f"Error loading file: {str(e)}")
            raise

class SaveFileHandler(FileSystemHandler):
    """Handler for saving files"""
    
    def process(self, params, progress_callback=None):
        """
        Save a file
        
        Args:
            params: Dictionary with:
                - file_type: Type of file (chat, document, prompt)
                - filename: Name of file to save
                - content: Content to save
            progress_callback: Function to report progress
            
        Returns:
            Dictionary with status
        """
        try:
            file_type = params.get('file_type')
            filename = params.get('filename')
            content = params.get('content')
            
            if not file_type or not filename or content is None:
                raise ValueError("Missing required parameters: file_type, filename, and content")
            
            base_dir = self.get_base_dir(file_type)
            file_path = base_dir / filename
            
            if progress_callback:
                progress_callback(f"Saving file: {file_path}")
            
            # Ensure path is safe
            if not self.is_safe_path(file_path, base_dir):
                raise ValueError(f"Access denied for path: {file_path}")
            
            # Create parent directories if they don't exist
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Save file based on type
            if file_type == 'chat':
                # For chats, save as JSON
                if not isinstance(content, dict):
                    raise ValueError("Chat content must be a dictionary")
                
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(content, f, ensure_ascii=False, indent=2)
            
            elif file_type == 'image':
                # For images, decode base64 and save
                if not isinstance(content, str):
                    raise ValueError("Image content must be a base64 string")
                
                try:
                    image_data = base64.b64decode(content)
                    with open(file_path, 'wb') as f:
                        f.write(image_data)
                except Exception as e:
                    raise ValueError(f"Failed to save image: {str(e)}")
            
            else:
                # For documents and prompts, save as text
                if not isinstance(content, str):
                    raise ValueError(f"{file_type} content must be a string")
                
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
            
            return {
                "status": "success",
                "message": f"File saved successfully: {filename}",
                "path": str(file_path.relative_to(base_dir))
            }
                
        except Exception as e:
            logging.error(f"Error saving file: {str(e)}")
            raise

class DeleteFileHandler(FileSystemHandler):
    """Handler for deleting files"""
    
    def process(self, params, progress_callback=None):
        """
        Delete a file
        
        Args:
            params: Dictionary with:
                - file_type: Type of file (chat, document, prompt, image)
                - filename: Name of file to delete
            progress_callback: Function to report progress
            
        Returns:
            Dictionary with status
        """
        try:
            file_type = params.get('file_type')
            filename = params.get('filename')
            
            if not file_type or not filename:
                raise ValueError("Missing required parameters: file_type and filename")
            
            base_dir = self.get_base_dir(file_type)
            file_path = base_dir / filename
            
            if progress_callback:
                progress_callback(f"Deleting file: {file_path}")
            
            # Ensure path is safe
            if not self.is_safe_path(file_path, base_dir):
                raise ValueError(f"Access denied for path: {file_path}")
            
            # Ensure file exists
            if not file_path.exists():
                raise ValueError(f"File not found: {file_path}")
            
            # Delete file or directory
            if file_path.is_dir():
                # Check if directory is empty
                if any(file_path.iterdir()):
                    raise ValueError("Cannot delete non-empty directory")
                file_path.rmdir()
            else:
                file_path.unlink()
            
            return {
                "status": "success",
                "message": f"Successfully deleted: {filename}"
            }
                
        except Exception as e:
            logging.error(f"Error deleting file: {str(e)}")
            raise 