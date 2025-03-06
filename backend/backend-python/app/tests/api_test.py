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
model_id = "deepseek-reasoner"
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