from pathlib import Path
from .file_manager import FileManager
import os
from utils.logging import log, LogLevel

# Use USER_DATA_DIR as base directory
USER_DATA_DIR = Path(os.getenv('USER_DATA_DIR', '/user-data'))

# Define subdirectories using environment variables or defaults
CHATS_DIR = Path(os.getenv('CHATS_DIR', USER_DATA_DIR / 'chats'))
DOCUMENTS_DIR = Path(os.getenv('DOCUMENTS_DIR', USER_DATA_DIR / 'documents'))
PROMPTS_DIR = Path(os.getenv('PROMPTS_DIR', USER_DATA_DIR / 'prompts'))

chat_manager = FileManager(CHATS_DIR, '.json', 'chat')
document_manager = FileManager(DOCUMENTS_DIR, '.md', 'document')
prompt_manager = FileManager(PROMPTS_DIR, '.txt', 'prompt') 