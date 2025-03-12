from pathlib import Path
from .file_manager import FileManager
from .directory_manager import DirectoryManager
import os
from utils.logging import log, LogLevel

# Use USER_DATA_DIR as base directory
USER_DATA_DIR = Path(os.getenv('USER_DATA_DIR', '/user-data'))

# Define subdirectories using environment variables or defaults
CHATS_DIR = Path(os.getenv('CHATS_DIR', USER_DATA_DIR / 'chats'))
DOCUMENTS_DIR = Path(os.getenv('DOCUMENTS_DIR', USER_DATA_DIR / 'documents'))
PROMPTS_DIR = Path(os.getenv('PROMPTS_DIR', USER_DATA_DIR / 'prompts'))

# File managers
chat_manager = FileManager(CHATS_DIR, '.json', 'chat')
document_manager = FileManager(DOCUMENTS_DIR, '.md', 'document')
prompt_manager = FileManager(PROMPTS_DIR, '.txt', 'prompt')

# Directory managers
chat_dir_manager = DirectoryManager(CHATS_DIR, 'chat')
document_dir_manager = DirectoryManager(DOCUMENTS_DIR, 'document')
prompt_dir_manager = DirectoryManager(PROMPTS_DIR, 'prompt')