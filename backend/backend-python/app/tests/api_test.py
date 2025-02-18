from openai import OpenAI
from dotenv import load_dotenv, find_dotenv
import os
from pathlib import Path

# Find and load the .env file from the app directory
dotenv_path = find_dotenv()
load_dotenv(dotenv_path)

# Get environment variables
api_key = os.getenv('DEEPSEEK_API_KEY')
base_url = os.getenv('DEEPSEEK_API_BASE_URL')
model = os.getenv('DEEPSEEK_API_MODEL')

print(f"api_key: {api_key}")
print(f"base_url: {base_url}")
print(f"model: {model}")

client = OpenAI(api_key=api_key, base_url=base_url)

response = client.chat.completions.create(
    model=model,
    messages=[
        {"role": "system", "content": "You are a helpful assistant"},
        {"role": "user", "content": "Hello"},
    ],
    stream=False
)

print(response.choices[0].message.content)