import json
from ai_operations import generate_response, get_models

def run_tests():
    """Runs a series of tests on the generate_response function."""

    print("\n" + "="*20 + " AVAILABLE MODELS " + "="*20)
    all_models = get_models()
    if all_models:
        print(json.dumps(all_models, indent=2))
    else:
        print("Could not retrieve models.")

    # Example 1: Using a thinking model
    print("\n" + "="*20 + " TESTING THINKING MODEL " + "="*20)
    test_messages_1 = [{"role": "user", "content": "9.11 and 9.8, which is greater? Explain your reasoning step-by-step."}]
    test_model_1 = "deepseek-reasoner" # Assuming this model exists and has thinking=True
    print(f"--- Calling model: {test_model_1} ---")
    result_1 = generate_response(model=test_model_1, messages=test_messages_1, system_prompt="You are a precise mathematical assistant.")

    if result_1:
        print("API Response:")
        print(json.dumps(result_1, indent=2))
    else:
        print("Failed to get response.")

    # Example 2: Using a non-thinking model
    print("\n" + "="*20 + " TESTING NON-THINKING MODEL " + "="*20)
    test_messages_2 = [{"role": "user", "content": "What is the capital of France?"}]
    test_model_2 = "deepseek-chat" # Assuming this model exists and has thinking=False
    print(f"--- Calling model: {test_model_2} ---")
    result_2 = generate_response(model=test_model_2, messages=test_messages_2) # No system prompt

    if result_2:
        print("API Response:")
        print(json.dumps(result_2, indent=2))
        # Verify reasoning fields are adjusted
        if 'reasoning_content' in result_2 and 'reasoning_tokens' in result_2:
            assert result_2['reasoning_content'] == "", "Reasoning content should be empty for non-thinking model"
            assert result_2['reasoning_tokens'] == 0, "Reasoning tokens should be 0 for non-thinking model"
            print("\nVerified: Reasoning content and tokens are empty/zero for non-thinking model.")
        else:
             print("\nWarning: Could not verify reasoning fields.")
    else:
        print("Failed to get response.")

    # Example 3: Non-existent model
    print("\n" + "="*20 + " TESTING INVALID MODEL " + "="*20)
    test_messages_3 = [{"role": "user", "content": "Test."}]
    test_model_3 = "non-existent-model"
    print(f"--- Calling model: {test_model_3} ---")
    result_3 = generate_response(model=test_model_3, messages=test_messages_3)
    if not result_3:
        print("Correctly handled non-existent model.")
    else:
        print(f"Error: Expected no response for non-existent model, but got: {json.dumps(result_3, indent=2)}")

    # Example 4: Gemini Pro model (will print raw response and return None)
    print("\n" + "="*20 + " TESTING GEMINI PRO MODEL " + "="*20)
    test_messages_4 = [{"role": "user", "content": "Write a short poem about coding."}]
    # Assuming 'gemini-2.5-pro-preview-03-25' exists in ai_models.py
    test_model_4 = "gemini-2.5-pro-preview-03-25"
    print(f"--- Calling model: {test_model_4} ---")
    result_4 = generate_response(model=test_model_4, messages=test_messages_4)
    if result_4 is None:
        print(f"Call to {test_model_4} completed (expected None after printing raw response).")
    else:
        # This part should ideally not be reached based on current ai_operations.py logic
        print(f"Error: Expected None response for Gemini model, but got: {json.dumps(result_4, indent=2)}")

    # Example 5: Gemini Flash model (will print raw response and return None)
    print("\n" + "="*20 + " TESTING GEMINI FLASH MODEL " + "="*20)
    test_messages_5 = [{"role": "user", "content": "What is 10 + 5?"}]
    # Assuming 'gemini-2.0-flash' exists in ai_models.py
    test_model_5 = "gemini-2.0-flash"
    print(f"--- Calling model: {test_model_5} ---")
    result_5 = generate_response(model=test_model_5, messages=test_messages_5)
    if result_5 is None:
        print(f"Call to {test_model_5} completed (expected None after printing raw response).")
    else:
        # This part should ideally not be reached based on current ai_operations.py logic
        print(f"Error: Expected None response for Gemini model, but got: {json.dumps(result_5, indent=2)}")

if __name__ == "__main__":
    run_tests() 