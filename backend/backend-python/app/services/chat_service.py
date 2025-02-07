from models.chat import ChatRequest, ChatResponse
from services.ai_service import AIService

class ChatService:
    def __init__(self):
        self.ai_service = AIService()

    async def process_message(self, request: ChatRequest) -> ChatResponse:
        try:
            # Convert Pydantic models to dictionaries and add system message
            messages = [
                {"role": "system", "content": "Please provide concise responses, aiming for 50 words or less when possible."},
                *[{"role": m.role, "content": m.content} for m in request.messages]
            ]
            response = await self.ai_service.generate_response(messages)
            return ChatResponse(response=response)
        except Exception as e:
            print(f"Error processing message: {e}")
            return ChatResponse(response="I apologize, but I encountered an error. Please try again.")