'''Main FastAPI server application.'''
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routers import http_frontend_echo
from backend.routers import http_frontend_fs 
from backend.routers import http_frontend_ai
from backend.routers import ws_frontend

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

app = FastAPI(
    title="Genesis Backend",
    description="Backend services for Genesis project.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(
    http_frontend_echo.router, 
    prefix="/frontend/echo",
    tags=["Frontend Echo"]
)
app.include_router(
    http_frontend_fs.router, 
    prefix="/frontend/fs",
    tags=["Frontend File System"]
)
app.include_router(
    http_frontend_ai.router,
    prefix="/frontend/ai",
    tags=["Frontend AI"]
)
app.include_router(
    ws_frontend.router,
    prefix="/frontend/ws",
    tags=["Frontend WebSocket"]
)

if __name__ == "__main__":
    uvicorn.run(
        "backend.server:app",  # Points to the 'app' instance in this 'server.py' file
        host="127.0.0.1",
        port=8000,
        log_level="info",
    ) 