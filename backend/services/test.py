import json
from ai_operations import generate_response, get_models

def run_tests():
    """Runs a simple test against all available models."""

    print("\n" + "="*20 + " FETCHING MODELS " + "="*20)
    all_models = get_models()
    if not all_models:
        print("Error: Could not retrieve models. Check ai_models.py and ai_operations.py.")
        return

    print(f"Found {len(all_models)} models to test:")
    print(json.dumps(list(all_models.keys()), indent=2))

    test_messages = [{"role": "user", "content": "hi"}]

    for model_name, model_details in all_models.items():
        print("\n" + "="*20 + f" TESTING MODEL: {model_name} " + "="*20)
        provider = model_details.get('provider', 'unknown')
        print(f"Provider: {provider}")
        print(f"Display Name: {model_details.get('display_name', 'N/A')}")
        print(f"Has Thinking: {model_details.get('has_thinking', 'N/A')}")
        print("-"*50)
        print(f"Sending prompt: {test_messages[0]['content']}")
        
        result = generate_response(model=model_name, messages=test_messages)

        print("-"*50)
        if result is not None:
            print("API Response Dictionary:")
            print(json.dumps(result, indent=2))
        elif provider == 'gemini':
             # Gemini currently prints raw response and returns None in ai_operations.py
             print(f"Call to Gemini model '{model_name}' completed (expected None after printing raw response).")
        else:
            print(f"Failed to get response for model: {model_name}")

if __name__ == "__main__":
    run_tests() 