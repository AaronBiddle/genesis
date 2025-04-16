from openai import OpenAI
from dotenv import load_dotenv
import os
from ai_models import AI_MODELS
import json # Added for pretty printing the output dictionary
import google.generativeai as genai # Added for Gemini

# Load environment variables
load_dotenv()

# Get API keys from environment variables
DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')


# genai.configure(api_key=GEMINI_API_KEY)
# model = genai.GenerativeModel('gemini-2.0-flash') 
# contents = ["How does AI work?"] 
# response = model.generate_content(contents)
# print(response)

genai.configure(api_key=GEMINI_API_KEY)
models = genai.list_models()

# Iterate through the models and print their names
for model in models:
    print(model.name)