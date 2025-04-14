from ai_operations import get_models

def print_models():
    models = get_models()
    print("\nAvailable AI Models:")
    print("=" * 50)
    for model in models:
        provider, model_name, display_name, has_thinking = model
        print(f"\nProvider: {provider}")
        print(f"Model Name: {model_name}")
        print(f"Display Name: {display_name}")
        print(f"Has Thinking Capability: {'Yes' if has_thinking else 'No'}")
        print("-" * 30)

if __name__ == "__main__":
    print_models() 