from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.ai_chat import router as ai_chat_router
from routes.chat_persistence import router as chat_persistence_router
from routes.document_routes import router as document_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the routers
app.include_router(ai_chat_router)
app.include_router(chat_persistence_router)
app.include_router(document_router)
