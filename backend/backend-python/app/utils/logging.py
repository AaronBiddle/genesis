from enum import Enum
from datetime import datetime
import functools
import os
import inspect

class LogLevel(Enum):
    ERROR = (0, "❌")      # Always show errors
    MINIMUM = (1, "⚙️")    # Production logging
    DEBUGGING = (2, "🔍")  # Development debugging
    TEMPORARY = (3, "🔧")  # Temporary debugging
    
    def __init__(self, value: int, icon: str):
        self._value_ = value
        self.icon = icon
    
    @classmethod
    def from_int(cls, value: int) -> 'LogLevel':
        """Convert an integer to a LogLevel enum value"""
        for level in cls:
            if level.value == value:
                return level
        raise ValueError(f"{value} is not a valid LogLevel")

# Always read from environment variable
CURRENT_LOG_LEVEL = LogLevel.from_int(int(os.getenv('LOG_LEVEL', '1')))

def get_timestamp():
    """Get current timestamp in HH:MM:SS.mmm format"""
    return datetime.now().strftime('%H:%M:%S.%f')[:-3]

def log(level: LogLevel, message: str):
    """
    Log a message with a specific level.
    
    Args:
        level: LogLevel enum indicating importance
        message: The message to log
        
    Raises:
        ValueError: If level is not a valid LogLevel enum value
    """
    if not isinstance(level, LogLevel):
        raise ValueError(f"Invalid log level: {level}. Must be a LogLevel enum value.")
        
    if level.value <= CURRENT_LOG_LEVEL.value:
        timestamp = get_timestamp()
        # Get the caller's filename
        frame = inspect.currentframe().f_back
        filename = os.path.basename(frame.f_code.co_filename)
        print(f"[{timestamp}] {level.icon} ({filename}) {message}")
