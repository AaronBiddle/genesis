from openai import OpenAI
from dotenv import load_dotenv, find_dotenv
import os
from pathlib import Path
from utils.config import get_model_api_config

# Find and load the .env file from the app directory
dotenv_path = find_dotenv()
load_dotenv(dotenv_path)

# Get model configuration
model_config = get_model_api_config()
model_id = model_config.get("model_id")
api_key = model_config.get("api_key")
base_url = model_config.get("base_url")

print(f"model_id: {model_id}")
print(f"api_key: {api_key}")
print(f"base_url: {base_url}")

client = OpenAI(api_key=api_key, base_url=base_url)

response = client.chat.completions.create(
    model=model_id,
    messages=[
        {"role": "system", "content": "You are a helpful assistant"},
        {"role": "user", "content": "Hello"},
    ],
    stream=False
)

print(response.choices[0].message.content)