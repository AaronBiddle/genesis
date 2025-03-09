from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.ai_chat import router as ai_chat_router
from routes.file_operations import router as file_operations_router
from routes.directory import router as directory_router
from routes.worker_connection import router as worker_connection_router
from routes.models import router as models_router
from utils.logging import LogLevel, log
import os

# Initialize the FastAPI app
app = FastAPI()

# Configure CORS
origins = os.environ.get("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Include the routers
app.include_router(ai_chat_router)
app.include_router(file_operations_router)
app.include_router(directory_router)
app.include_router(worker_connection_router)
app.include_router(models_router)

# Log startup information
log(LogLevel.MINIMUM, "🐍 Backend server started")
