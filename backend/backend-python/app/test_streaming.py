import asyncio

from services.ai_service import AIService  # Import the AIService class

async def test_streaming_response():
    # Create an instance of AIService.
    ai_service = AIService()
    
    # Prepare a message list including the system prompt and a test user prompt.
    messages = [
        {
            "role": "system",
            "content": "Please provide concise responses, aiming for 50 words or less when possible."
        },
        {
            "role": "user",
            "content": "Tell me a short story."
        }
    ]
    
    print("Starting streaming test. Tokens received:")
    
    try:
        # Call the streaming function and print tokens as they come.
        async for token in ai_service.generate_response_stream(messages):
            print(token, end="", flush=True)
    except Exception as e:
        print(f"\nAn error occurred: {e}")

    print("\nStreaming complete.")

if __name__ == "__main__":
    asyncio.run(test_streaming_response()) 