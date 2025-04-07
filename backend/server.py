'''Main FastAPI server application.'''
import uvicorn
from fastapi import FastAPI

from backend.routers import http_frontend

app = FastAPI(
    title="Genesis Backend",
    description="Backend services for Genesis project.",
    version="0.1.0",
)

# Include routers
app.include_router(http_frontend.router, prefix="/frontend", tags=["Frontend"])

@app.get("/", tags=["Root"])
def read_root():
    return {"message": "Welcome to the Genesis Backend!"}

if __name__ == "__main__":
    # Configuration for Uvicorn server
    # You can adjust host, port, log_level, etc. as needed
    uvicorn.run(
        "server:app",  # Points to the 'app' instance in this 'server.py' file
        host="127.0.0.1",
        port=8000,
        reload=True,  # Enable auto-reload for development
        log_level="info",
    ) 