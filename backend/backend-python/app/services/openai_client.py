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

async def stream_chat_response(prompt: str, history: list = None, system_prompt: str = "You are a helpful assistant.", temperature: float = 0.7) -> AsyncGenerator[tuple[str, Any], None]:
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
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ])
        
        # Calculate total input tokens
        total_input_length = sum(len(msg["content"]) for msg in messages)
        log(LogLevel.DEBUGGING, f"🤖 Total input length: {total_input_length} characters")
        
        completion = await loop.run_in_executor(
            None,
            lambda: client.chat.completions.create(
                messages=messages,
                model=MODEL,
                temperature=temperature,
                stream=True
            )
        )
        
        received_any_tokens = False
        for chunk in completion:
            received_any_tokens = True
            token = getattr(chunk.choices[0].delta, "content", "")
            
            if chunk.choices[0].finish_reason is not None:
                log(LogLevel.DEBUGGING, f"🤖 Final chunk with usage stats: {chunk.usage}")
                yield token, chunk.usage
            else:
                if token:
                    log(LogLevel.VERBOSE, f"🤖 Token generated: {token}", end="")
                yield token, None
        
        if not received_any_tokens:
            log(LogLevel.MINIMUM, "🤖 Warning: No tokens were received from the API")
            raise Exception("No response received from API")
            
    except Exception as e:
        log(LogLevel.MINIMUM, f"🤖 Error in stream_chat_response: {str(e)}")
        raise