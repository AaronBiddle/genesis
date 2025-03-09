from openai import OpenAI
from dotenv import load_dotenv, find_dotenv
import os
import sys
from pathlib import Path

# Find and load the .env file from the app directory
dotenv_path = find_dotenv()
load_dotenv(dotenv_path)

# Add the app directory to the Python path using the APP_DIR environment variable
app_dir = os.environ.get('APP_DIR', '/app')
if app_dir not in sys.path:
    sys.path.append(app_dir)

# Now import the config module
from utils.config import get_model_api_config

# Get model configuration
model_config = get_model_api_config()
model_id = model_config.get("model_id")
api_key = model_config.get("api_key")
base_url = model_config.get("base_url")

print(f"model_id: {model_id}")
print(f"api_key: {api_key}")
print(f"base_url: {base_url}")

client = OpenAI(api_key=api_key, base_url=base_url)

# Example 1: Non-streaming response
print("\n--- Non-streaming response ---")
response = client.chat.completions.create(
    model=model_id,
    messages=[
        {"role": "system", "content": "You are a helpful assistant"},
        {"role": "user", "content": "What is 15 * 17?"},
    ],
    stream=False
)

print(f"Final answer: {response.choices[0].message.content}")
if hasattr(response.choices[0].message, 'reasoning_content'):
    print(f"Reasoning process: {response.choices[0].message.reasoning_content}")

# Example 2: Streaming response
print("\n--- Streaming response ---")
stream_response = client.chat.completions.create(
    model=model_id,
    messages=[
        {"role": "system", "content": "You are a helpful assistant"},
        {"role": "user", "content": "What is the square root of 144?"},
    ],
    stream=True
)

reasoning_content = ""
content = ""

print("Streaming chunks as they arrive:")
for chunk in stream_response:
    # Check if the chunk contains reasoning_content
    if hasattr(chunk.choices[0].delta, 'reasoning_content') and chunk.choices[0].delta.reasoning_content:
        reasoning_content += chunk.choices[0].delta.reasoning_content
        print(f"Reasoning chunk: {chunk.choices[0].delta.reasoning_content}", end="", flush=True)
    
    # Check if the chunk contains regular content
    if hasattr(chunk.choices[0].delta, 'content') and chunk.choices[0].delta.content:
        content += chunk.choices[0].delta.content
        print(f"Content chunk: {chunk.choices[0].delta.content}", end="", flush=True)

print("\n\nFinal accumulated content:")
print(f"Final answer: {content}")
print(f"Reasoning process: {reasoning_content}")