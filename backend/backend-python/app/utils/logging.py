from enum import IntEnum
from datetime import datetime
import functools

class LogLevel(IntEnum):
    NONE = 0
    MINIMUM = 1
    DEBUGGING = 2
    VERBOSE = 3

# Set the current log level
CURRENT_LOG_LEVEL = LogLevel.MINIMUM

def get_timestamp():
    return datetime.now().strftime('%H:%M:%S.%f')[:-3]

def log(level: LogLevel, message: str, end: str = '\n'):
    if level <= CURRENT_LOG_LEVEL:
        timestamp = get_timestamp()
        print(f"[{timestamp}] {message}", end=end, flush=True)

def debug_log(level: LogLevel):
    """Decorator for debug logging functions"""
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            func_name = func.__name__
            log(level, f"🐍 Entering {func_name}")
            try:
                result = await func(*args, **kwargs)
                log(level, f"🐍 Exiting {func_name}")
                return result
            except Exception as e:
                log(level, f"🐍 Error in {func_name}: {str(e)}")
                raise
        return wrapper
    return decorator 