from enum import Enum
from datetime import datetime
import functools
import os

class LogLevel(Enum):
    MINIMUM = 1
    DEBUGGING = 2

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
        # Handle both enum and string prefixes
        prefix_str = prefix.value if isinstance(prefix, LogPrefix) else prefix
        print(f"[{timestamp}] {prefix_str} {message}")

def debug_log(level: LogLevel = LogLevel.DEBUGGING):
    """
    Decorator for logging function entry/exit
    """
    def decorator(func):
        async def wrapper(*args, **kwargs):
            func_name = func.__name__
            log(level, f"Entering {func_name}", LogPrefix.DEBUG)
            # Don't wrap the function execution in try/except
            # Let the original function handle its own exceptions
            return await func(*args, **kwargs)
        # Preserve the original function's attributes
        from functools import update_wrapper
        update_wrapper(wrapper, func)
        return wrapper
    return decorator 