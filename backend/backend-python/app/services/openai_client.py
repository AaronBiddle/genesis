import os
import asyncio
from typing import AsyncGenerator, Any
from openai import OpenAI
from dotenv import load_dotenv
from utils.logging import LogLevel, log

# Load environment variables from .env file.
load_dotenv()

# Initialize the client with DeepSeek credentials from .env.
client = OpenAI(
    api_key=os.environ.get("DEEPSEEK_API_KEY"),
    base_url=os.environ.get("DEEPSEEK_API_BASE_URL")
)


MODEL = os.environ.get("DEEPSEEK_API_MODEL", "gpt-4o")
TEMPERATURE = 0.7

DEBUG_OPENAI = False

def chat_completion_sync(prompt: str) -> str:
    """
    Synchronously gets a chat completion using the new API.
    """
    response = client.chat.completions.create(
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt},
        ],
        model=MODEL,
        temperature=TEMPERATURE
    )
    return response.choices[0].message["content"].strip()

async def get_chat_response(prompt: str) -> str:
    """
    Asynchronously wraps the synchronous chat completion call.
    """
    loop = asyncio.get_running_loop()
    answer = await loop.run_in_executor(
        None,
        lambda: chat_completion_sync(prompt)
    )
    return answer

def stream_chat_completion_sync(prompt: str):
    """
    Synchronously initiates a streaming chat completion request.
    """
    return client.chat.completions.create(
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt},
        ],
        model=MODEL,
        temperature=TEMPERATURE,
        stream=True  # Enable streaming
    )

async def stream_chat_response(prompt: str, history: list = None) -> AsyncGenerator[tuple[str, Any], None]:
    """
    Asynchronously yields tokens from a streaming chat completion.
    """
    log(LogLevel.DEBUGGING, f"🤖 Starting chat stream for prompt: {prompt}")
    loop = asyncio.get_running_loop()
    try:
        messages = []
        if history:
            messages.extend([{"role": msg["role"], "content": msg["content"]} for msg in history])
        messages.extend([
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt}
        ])
        
        completion = await loop.run_in_executor(
            None,
            lambda: client.chat.completions.create(
                messages=messages,
                model=MODEL,
                temperature=TEMPERATURE,
                stream=True
            )
        )
        
        for chunk in completion:
            token = getattr(chunk.choices[0].delta, "content", "")
            
            # Check if this is the final chunk (it will have finish_reason set)
            if chunk.choices[0].finish_reason is not None:
                log(LogLevel.DEBUGGING, f"🤖 Final chunk with usage stats: {chunk.usage}")
                yield token, chunk.usage
            else:
                if token:
                    log(LogLevel.VERBOSE, f"🤖 Token generated: {token}", end="")
                yield token, None
            
    except Exception as e:
        log(LogLevel.MINIMUM, f"🤖 Error in stream_chat_response: {e}")
        raise