import os
import asyncio
from typing import AsyncGenerator
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables from .env file.
load_dotenv()

# Initialize the client with DeepSeek credentials from .env.
client = OpenAI(
    api_key=os.environ.get("DEEPSEEK_API_KEY"),
    base_url=os.environ.get("DEEPSEEK_API_BASE_URL")
)


MODEL = os.environ.get("DEEPSEEK_API_MODEL", "gpt-4o")
TEMPERATURE = 0.7

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

async def stream_chat_response(prompt: str) -> AsyncGenerator[str, None]:
    """
    Asynchronously yields tokens from a streaming chat completion.
    """
    loop = asyncio.get_running_loop()
    generator = await loop.run_in_executor(
        None,
        lambda: stream_chat_completion_sync(prompt)
    )
    for chunk in generator:
        token = getattr(chunk.choices[0].delta, "content", "")
        yield token