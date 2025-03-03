import os
import asyncio
from typing import AsyncGenerator, Any
from openai import OpenAI
from dotenv import load_dotenv, find_dotenv
from utils.logging import LogLevel, log
import json
import time

# Load environment variables from .env file.

dotenv_path = find_dotenv()
print(f"dotenv_path: {dotenv_path}")
load_dotenv(dotenv_path)

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
    Synchronously gets a chat completion using the API.
    """
    response = client.chat.completions.create(
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt},
        ],
        model=MODEL,
        temperature=TEMPERATURE
    )
    return response.choices[0].message.content.strip()

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

async def stream_chat_response(prompt: str, history: list = None, temperature: float = TEMPERATURE) -> AsyncGenerator[tuple[str, Any], None]:
    """
    Asynchronously streams chat completion using the API.
    Returns tuples of (content_chunk, usage_stats).
    """
    try:
        messages = []
        if history:
            messages.extend(history)
        else:
            messages.append({"role": "system", "content": "You are a helpful assistant."})
            
        messages.append({"role": "user", "content": prompt})

        # Create truncated version of messages for logging
        debug_messages = [
            {
                "role": msg["role"],
                "content": msg["content"] if msg["role"] == "system" else (msg["content"][:10] + "...")
            } for msg in messages
        ]
        log(LogLevel.DEBUGGING, f"Sending messages (temp={temperature}): {json.dumps(debug_messages)}")
        
        # Create the completion in a separate thread to avoid blocking
        loop = asyncio.get_running_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.chat.completions.create(
                messages=messages,
                model=MODEL,
                temperature=temperature,
                stream=True
            )
        )

        # Process chunks as they arrive
        async def process_stream():
            for chunk in response:
                # Yield control back to the event loop frequently
                await asyncio.sleep(0)
                
                delta = chunk.choices[0].delta
                is_final = chunk.choices[0].finish_reason == 'stop'
                
                # If there's content, yield it with usage stats (if it's the final chunk)
                if delta.content:
                    yield delta.content, chunk.usage if is_final else None
                # If it's the final chunk with no content, yield the usage stats with empty content
                elif is_final:
                    yield "", chunk.usage

        # Use async iteration to process the stream
        async for content, usage in process_stream():
            yield content, usage

        log(LogLevel.DEBUGGING, "Stream complete")

    except Exception as e:
        log(LogLevel.ERROR, f"Error in stream_chat_response: {str(e)}")
        raise