from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.ai_chat import router as ai_chat_router
from routes.chats import router as chats_router
from routes.documents import router as documents_router
from routes.directory import router as directory_router
from routes.worker_connection import router as worker_connection_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Include the routers
app.include_router(ai_chat_router)
app.include_router(chats_router)
app.include_router(documents_router)
app.include_router(directory_router)
app.include_router(worker_connection_router)
