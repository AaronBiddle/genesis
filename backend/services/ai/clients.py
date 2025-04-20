import os
from openai import OpenAI
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables first
load_dotenv()

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
GEMINI_API_KEY   = os.getenv("GEMINI_API_KEY")

# Initialize DeepSeek client
if DEEPSEEK_API_KEY:
    deepseek_client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url="https://api.deepseek.com")
    print("DeepSeek client initialized.")
else:
    deepseek_client = None
    print("Warning: DEEPSEEK_API_KEY not found. DeepSeek client not initialized.")


# Configure Gemini API
if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        print("Gemini API configured successfully via genai.configure().")
        gemini_configured = True
    except Exception as e:
        print(f"Error configuring Gemini API via genai.configure(): {e}")
        gemini_configured = False
else:
    print("Warning: GEMINI_API_KEY not found. Gemini models will not be available.")
    gemini_configured = False

# You might want to expose a function to check Gemini status if needed elsewhere
def is_gemini_configured():
    return gemini_configured 