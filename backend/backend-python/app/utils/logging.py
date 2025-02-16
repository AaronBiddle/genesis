from enum import Enum
from datetime import datetime
import functools
import os
import inspect

class LogLevel(Enum):
    ERROR = 0      # Always show errors
    MINIMUM = 1    # Production logging
    DEBUGGING = 2  # Development debugging
    TEMPORARY = 3  # Temporary debugging

class LogPrefix(str, Enum):
    SYSTEM = "⚙️"
    CHAT = "💬"
    FILE = "📄"
    ERROR = "❌"
    AI = "🤖"
    DEBUG = "🔍"

# Always read from environment variable
CURRENT_LOG_LEVEL = LogLevel(int(os.getenv('LOG_LEVEL', '1')))

def get_timestamp():
    """Get current timestamp in HH:MM:SS.mmm format"""
    return datetime.now().strftime('%H:%M:%S.%f')[:-3]

def log(level: LogLevel, message: str, prefix: LogPrefix | str = LogPrefix.SYSTEM):
    """
    Log a message with a specific level and prefix.
    
    Args:
        level: LogLevel enum indicating importance
        message: The message to log
        prefix: LogPrefix enum or string for custom prefix
    """
    if level.value <= CURRENT_LOG_LEVEL.value:
        timestamp = get_timestamp()
        # Get the caller's filename
        frame = inspect.currentframe().f_back
        filename = os.path.basename(frame.f_code.co_filename)
        # Handle both enum and string prefixes
        prefix_str = prefix.value if isinstance(prefix, LogPrefix) else prefix
        print(f"[{timestamp}] {prefix_str} ({filename}) {message}")

# def debug_log(level: LogLevel = LogLevel.DEBUGGING):
#     """
#     Decorator for logging function entry/exit
#     """
#     def decorator(func):
#         async def wrapper(*args, **kwargs):
#             func_name = func.__name__
#             log(level, f"Entering {func_name}", LogPrefix.DEBUG)
#             # Don't wrap the function execution in try/except
#             # Let the original function handle its own exceptions
#             return await func(*args, **kwargs)
#         # Preserve the original function's attributes
#         from functools import update_wrapper
#         update_wrapper(wrapper, func)
#         return wrapper
#     return decorator 