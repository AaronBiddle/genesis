'''Service layer for handling file system operations with validation.'''

import os
import shutil
import logging
from fastapi import HTTPException, status
from typing import List, Dict, Literal, Tuple, Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Configuration: Mount Points ---
# Define allowed base directories (mount points) with access control
# 'name' is the prefix users will use (e.g., "userdata/")
# 'path' is the absolute system path
# 'access' controls permissions ('readonly' or 'readwrite')
MOUNT_POINTS: List[Dict[str, str]] = [
    {
        "name": "userdata/",
        "path": "D:/projects/genesis/userdata", # Use forward slashes for consistency
        "access": "readwrite"
    },
    {
        "name": "D:/",
        "path": "D:/",
        "access": "readonly"
    },
    # Add more mount points as needed
]

# Ensure mount point paths are absolute and normalized for reliable comparison
for mp in MOUNT_POINTS:
    mp['path'] = os.path.abspath(mp['path']).replace('\\', '/') # Normalize to forward slashes
    if not mp['path'].endswith('/'):
         mp['path'] += '/'
    if not mp['name'].endswith('/'):
         mp['name'] += '/'

# --- Helper Functions ---

def resolve_path(user_path: str) -> Tuple[str, Dict[str, str], Literal['read', 'write']]:
    """
    Resolves a user-provided path (e.g., 'userdata/myfile.txt') to an absolute path,
    validates it against MOUNT_POINTS, checks for path traversal, and determines access.

    Returns:
        Tuple[str, Dict[str, str], Literal['read', 'write']]: 
            (absolute_resolved_path, matched_mount_point_info, determined_access_level)

    Raises:
        HTTPException: If path is invalid, outside mount points, or involves traversal.
    """
    normalized_user_path = user_path.replace('\\', '/')

    matched_mount = None
    for mp in MOUNT_POINTS:
        if normalized_user_path.startswith(mp['name']):
            matched_mount = mp
            break

    if not matched_mount:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Path does not start with a valid mount point prefix (e.g., {', '.join([mp['name'] for mp in MOUNT_POINTS])}).")

    # Construct the potential absolute path
    relative_part = normalized_user_path[len(matched_mount['name']):]
    potential_abs_path = os.path.abspath(os.path.join(matched_mount['path'], relative_part)).replace('\\', '/')

    # Security Check: Ensure the resolved path is still within the mount point base path
    # This prevents traversal attacks like "userdata/../sensitive_file"
    if not potential_abs_path.startswith(matched_mount['path']):
         # Log the attempt for security auditing
        logger.warning(f"Potential path traversal attempt: User path '{user_path}' resolved outside mount '{matched_mount['name']}' to '{potential_abs_path}'")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid path: Access denied.")

    logger.debug(f"Resolved path '{user_path}' to '{potential_abs_path}' within mount '{matched_mount['name']}'")
    return potential_abs_path, matched_mount

def check_permissions(mount_info: Dict[str, str], required_access: Literal['read', 'write']):
    """
    Checks if the required access level is permitted for the given mount point.

    Raises:
        HTTPException: If access is denied.
    """
    if required_access == 'write' and mount_info['access'] != 'readwrite':
        logger.warning(f"Write access denied for path within readonly mount '{mount_info['name']}'")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Write access denied for mount '{mount_info['name']}'")
    # Read access is implicitly granted for both 'readonly' and 'readwrite'
    logger.debug(f"Access check passed: Required '{required_access}', Mount '{mount_info['name']}' has '{mount_info['access']}'")

# --- Service Functions ---

def get_mount_info() -> List[Dict[str, str]]:
    """Returns the list of mount points (potentially filtered for frontend use)."""
    # Return a copy or specific fields if needed, e.g., don't expose absolute paths directly if sensitive
    return MOUNT_POINTS # For now, return the full info

def perform_read_file(user_path: str) -> str:
    """Reads a file after validating the path and permissions."""
    abs_path, mount_info = resolve_path(user_path)
    check_permissions(mount_info, 'read')

    if not os.path.exists(abs_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"File not found: {user_path}")
    if not os.path.isfile(abs_path):
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Path is not a file: {user_path}")

    try:
        with open(abs_path, 'r', encoding='utf-8') as f:
            content = f.read()
        logger.info(f"Successfully read file: {abs_path}")
        return content
    except Exception as e:
        logger.error(f"Error reading file {abs_path} (user path: {user_path}): {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to read file: {e}")

def perform_write_file(user_path: str, content: str) -> Dict[str, str]:
    """Writes to a file after validating the path and permissions."""
    abs_path, mount_info = resolve_path(user_path)
    check_permissions(mount_info, 'write')

    # Ensure parent directory exists
    parent_dir = os.path.dirname(abs_path)
    if not os.path.exists(parent_dir):
         try:
             # Check if creating the parent is within the mount point (redundant but safe)
             _, parent_mount_info = resolve_path(os.path.dirname(user_path) + '/') # Add slash to treat as dir path
             if parent_mount_info['name'] != mount_info['name']:
                 raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot create parent directory across mount points.")
             check_permissions(parent_mount_info, 'write')
             os.makedirs(parent_dir, exist_ok=True)
             logger.info(f"Created parent directory: {parent_dir}")
         except HTTPException as http_exc:
             raise http_exc # Propagate permission/validation errors
         except Exception as e:
            logger.error(f"Error creating parent directory {parent_dir} for {abs_path}: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to create parent directory: {e}")
    elif not os.path.isdir(parent_dir):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid path: Parent is not a directory for {user_path}")

    try:
        with open(abs_path, 'w', encoding='utf-8') as f:
            f.write(content)
        logger.info(f"Successfully wrote file: {abs_path}")
        return {"message": f"File '{user_path}' written successfully."}
    except Exception as e:
        logger.error(f"Error writing file {abs_path} (user path: {user_path}): {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to write file: {e}")

def perform_delete_file(user_path: str) -> Dict[str, str]:
    """Deletes a file after validating the path and permissions."""
    abs_path, mount_info = resolve_path(user_path)
    check_permissions(mount_info, 'write')

    if not os.path.exists(abs_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"File not found: {user_path}")
    if not os.path.isfile(abs_path):
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Path is not a file: {user_path}")

    try:
        os.remove(abs_path)
        logger.info(f"Successfully deleted file: {abs_path}")
        return {"message": f"File '{user_path}' deleted successfully."}
    except Exception as e:
        logger.error(f"Error deleting file {abs_path} (user path: {user_path}): {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to delete file: {e}")

def perform_create_directory(user_path: str) -> Dict[str, str]:
    """Creates a directory after validating the path and permissions."""
    # Ensure user path ends with / for consistency, helps resolve_path logic
    if not user_path.endswith('/'):
        user_path += '/'
        
    abs_path, mount_info = resolve_path(user_path)
    check_permissions(mount_info, 'write')

    if os.path.exists(abs_path) and not os.path.isdir(abs_path):
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Path exists but is not a directory: {user_path}")

    try:
        os.makedirs(abs_path, exist_ok=True) # exist_ok=True makes it idempotent
        logger.info(f"Successfully ensured directory exists: {abs_path}")
        return {"message": f"Directory '{user_path}' created/exists."}
    except Exception as e:
        logger.error(f"Error creating directory {abs_path} (user path: {user_path}): {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to create directory: {e}")

def perform_list_directory(user_path: str) -> List[Dict[str, str]]:
    """Lists directory contents after validating the path and permissions."""
    if not user_path.endswith('/'):
        user_path += '/'
        
    abs_path, mount_info = resolve_path(user_path)
    check_permissions(mount_info, 'read')

    if not os.path.exists(abs_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Directory not found: {user_path}")
    if not os.path.isdir(abs_path):
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Path is not a directory: {user_path}")

    try:
        items = []
        for item_name in os.listdir(abs_path):
            item_abs_path = os.path.join(abs_path, item_name)
            item_type = 'directory' if os.path.isdir(item_abs_path) else 'file'
            # Construct user-facing path relative to the mount point
            item_user_path = mount_info['name'] + item_abs_path[len(mount_info['path']):].replace('\\', '/')
            items.append({
                "name": item_name, 
                "path": item_user_path, # Return the user-resolvable path 
                "type": item_type
            })
        logger.info(f"Successfully listed directory: {abs_path}")
        return items
    except Exception as e:
        logger.error(f"Error listing directory {abs_path} (user path: {user_path}): {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to list directory: {e}")

def perform_delete_directory(user_path: str) -> Dict[str, str]:
    """Deletes an empty directory after validating the path and permissions."""
    # Note: For non-empty deletion, consider adding a recursive=True flag and using shutil.rmtree
    if not user_path.endswith('/'):
        user_path += '/'
        
    abs_path, mount_info = resolve_path(user_path)
    check_permissions(mount_info, 'write')

    if not os.path.exists(abs_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Directory not found: {user_path}")
    if not os.path.isdir(abs_path):
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Path is not a directory: {user_path}")

    try:
        # Attempt to delete - os.rmdir fails if not empty
        os.rmdir(abs_path)
        logger.info(f"Successfully deleted empty directory: {abs_path}")
        return {"message": f"Directory '{user_path}' deleted successfully."}
    except OSError as e:
         if "Directory not empty" in str(e) or (hasattr(e, 'errno') and e.errno == 39): # Check specific error
              logger.warning(f"Attempt to delete non-empty directory {abs_path} (user path: {user_path})")
              raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Directory not empty. Cannot delete non-empty directories.")
         else:
              logger.error(f"OS error deleting directory {abs_path} (user path: {user_path}): {e}")
              raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to delete directory: {e}")
    except Exception as e:
        logger.error(f"Error deleting directory {abs_path} (user path: {user_path}): {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to delete directory: {e}")

# --- End of Service --- 