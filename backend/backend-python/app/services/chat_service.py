from models.chat import ChatRequest, ChatResponse

class ChatService:
    async def process_message(self, request: ChatRequest) -> ChatResponse:
        # Dummy response logic
        last_message = request.messages[-1].content
        
        if "hello" in last_message.lower():
            response = "Hello! How can I help you today?"
        elif "code" in last_message.lower():
            response = "I can help you with coding! What language are you working with?"
        elif "python" in last_message.lower():
            response = "Python is great! Here's a simple example:\n\ndef greet(name):\n    return f'Hello, {name}!'"
        else:
            response = "I understand. Please tell me more about what you need help with."
            
        return ChatResponse(response=response)