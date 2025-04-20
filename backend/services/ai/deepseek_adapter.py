# backend/services/ai/deepseek_adapter.py
import httpx # Use httpx for direct async HTTP calls
from .ai_extraction import extract_response_data
# Import the API key directly from clients
from .clients import DEEPSEEK_API_KEY 

# Global variable to hold the shared httpx client instance
_async_client: httpx.AsyncClient | None = None

def _get_async_client() -> httpx.AsyncClient:
    """Initializes and returns a shared httpx.AsyncClient instance."""
    global _async_client
    if _async_client is None:
        if not DEEPSEEK_API_KEY:
            # Handle the case where the key might be missing during client creation
            # Although async_generate checks again, it's good practice here too.
            raise ValueError("DEEPSEEK_API_KEY not found or not configured.")
            
        _async_client = httpx.AsyncClient(
            base_url="https://api.deepseek.com",
            headers={
                "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                "Content-Type": "application/json", # Explicitly set Content-Type
                "Accept": "application/json" # Explicitly set Accept
            },
            timeout=60.0, # Set a reasonable timeout
            # Configure connection limits for potentially higher concurrency
            limits=httpx.Limits(max_connections=100, max_keepalive_connections=20) 
        )
        print("Initialized shared httpx.AsyncClient for DeepSeek.")
    return _async_client

async def async_generate(model: str, messages: list, has_thinking: bool, **kwargs):
    """Asynchronously generates response using a shared httpx client."""
    # Basic check for API key availability
    if not DEEPSEEK_API_KEY:
        print("Error: DEEPSEEK_API_KEY not found. Cannot make API call.")
        return None

    # --- Logging Start (Optional but helpful) ---
    # import datetime
    # start_time = datetime.datetime.now()
    # print(f"[{start_time.isoformat()}] DeepSeek httpx async_generate started for model {model}")
    # --- Logging End ---

    try:
        # Build the payload, ensuring messages and model are present
        # Filter out any kwargs passed with a value of None
        data = {
            "model": model,
            "messages": messages,
            **{k: v for k, v in kwargs.items() if v is not None} 
        }

        # Get the shared client instance
        client = _get_async_client()

        # --- Logging Start (Optional but helpful) ---
        # api_call_start = datetime.datetime.now()
        # print(f"[{api_call_start.isoformat()}] DeepSeek calling httpx API for model {model}...")
        # --- Logging End ---

        # Make the POST request
        resp = await client.post("/chat/completions", json=data)

        # --- Logging Start (Optional but helpful) ---
        # api_call_end = datetime.datetime.now()
        # print(f"[{api_call_end.isoformat()}] DeepSeek httpx API call finished for model {model}. Status: {resp.status_code}. Duration: {api_call_end - api_call_start}")
        # --- Logging End ---

        # Raise an exception for bad status codes (4xx or 5xx)
        resp.raise_for_status()

        # Parse the JSON response payload
        payload = resp.json()

        # Extract the relevant data using the existing function
        # Note: Ensure extract_response_data can handle a raw dict payload
        response_data = extract_response_data(payload, provider="deepseek", has_thinking=has_thinking)

        # --- Logging Start (Optional but helpful) ---
        # end_time = datetime.datetime.now()
        # print(f"[{end_time.isoformat()}] DeepSeek httpx async_generate finished for model {model}. Total duration: {end_time - start_time}")
        # --- Logging End ---

        return response_data

    except httpx.HTTPStatusError as e:
        # Log specific HTTP errors (like 4xx, 5xx)
        print(f"HTTP error occurred: {e.response.status_code} - {e.response.text}")
        # Consider logging e.request details as well
        return None
    except httpx.RequestError as e:
        # Log connection errors, timeouts, etc.
        print(f"httpx request error occurred: {e}")
        return None
    except Exception as e:
        # Catch-all for other unexpected errors (e.g., during extraction)
        print(f"An unexpected error occurred in DeepSeek async_generate: {e}")
        return None

# Remove the old sync_generate and the previous async_generate functions 