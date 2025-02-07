from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import chat
from config import get_settings

app = FastAPI(title="Genesis Backend API")
settings = get_settings()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins.split(","),  # Now using environment setting
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router)

@app.get("/")
async def root():
    return {"message": "Welcome to Genesis Backend API"}