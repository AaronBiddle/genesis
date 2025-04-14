from openai import OpenAI
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Get API keys from environment variables
DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url="https://api.deepseek.com")

# Round 1
messages = [{"role": "user", "content": "9.11 and 9.8, which is greater?"}]
response = client.chat.completions.create(
    model="deepseek-reasoner",
    messages=messages
)

content = response.choices[0].message.content
reasoning_content = response.choices[0].message.reasoning_content
completion_tokens = response.usage.completion_tokens
prompt_tokens = response.usage.prompt_tokens
reasoning_tokens = response.usage.completion_tokens_details.reasoning_tokens
total_tokens = response.usage.total_tokens
cache_hit_tokens = response.usage.prompt_cache_hit_tokens
cache_miss_tokens = response.usage.prompt_cache_miss_tokens
finish_reason = response.choices[0].finish_reason

print(f"Content: {content}\n\n")
print(f"Reasoning Content: {reasoning_content}\n\n")
print("-------------------------------------\n\n")
print(f"Completion Tokens: {completion_tokens}")
print(f"Prompt Tokens: {prompt_tokens}")
print(f"Reasoning Tokens: {reasoning_tokens}")
print(f"Total Tokens: {total_tokens}")
print(f"Cache Hit Tokens: {cache_hit_tokens}")
print(f"Cache Miss Tokens: {cache_miss_tokens}")
print(f"Finish Reason: {finish_reason}")

