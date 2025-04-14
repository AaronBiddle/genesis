from openai import OpenAI
from dotenv import load_dotenv
import os
from ai_models import AI_MODELS

# Load environment variables
load_dotenv()

# Get API keys from environment variables
DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

def get_models():
    ai_models_dict = {}
    try:
        # Use a dictionary comprehension to convert the list to a dict
        ai_models_dict = {
            model_info[1]: {  # Key: model name (index 1)
                'provider': model_info[0],     # Value part 1: provider (index 0)
                'display_name': model_info[2], # Value part 2: display name (index 2)
                'has_thinking': model_info[3]  # Value part 3: thinking capability (index 3)
            }
            # Iterate through the global list
            for model_info in AI_MODELS
        }
    except (NameError, TypeError, IndexError) as e:
        # Handle cases where AI_MODELS might not be defined or has wrong format
        print(f"Warning: Could not process AI_MODELS list. Error: {e}")
        # Optionally, log the error instead of printing
        return {} # Return an empty dictionary on error

    return ai_models_dict

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

