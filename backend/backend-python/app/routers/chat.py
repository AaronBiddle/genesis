from fastapi import APIRouter
from models.chat import ChatRequest, ChatResponse
from services.chat_service import ChatService

router = APIRouter()
chat_service = ChatService()

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    return await chat_service.process_message(request)