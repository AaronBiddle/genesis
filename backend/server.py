'''Main FastAPI server application.'''
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # Import CORS middleware

from backend.routers import http_frontend_echo
# Import the new filesystem router
from backend.routers import http_frontend_fs 

# List of allowed origins (clients that can make requests)
# Add your frontend development server URL here
origins = [
    "http://localhost:5173", # Vite default
    "http://127.0.0.1:5173", # Vite default
    "http://localhost:8000", # Allow requests from the backend itself if needed
    "http://127.0.0.1:8000",
    # Add other origins if needed (e.g., production frontend URL)
]

app = FastAPI(
    title="Genesis Backend",
    description="Backend services for Genesis project.",
    version="0.1.0",
)

# Add CORS middleware to the application
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Allows specified origins
    allow_credentials=True, # Allows cookies to be included in requests
    allow_methods=["*"],    # Allows all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],    # Allows all headers
)

# Include routers
app.include_router(
    http_frontend_echo.router, 
    prefix="/frontend/echo",  # Define full prefix here
    tags=["Frontend Echo"]     # Update tag
)
app.include_router(
    http_frontend_fs.router, 
    prefix="/frontend/fs",    # Define full prefix here
    tags=["Frontend File System"] # Ensure tag is set
)

@app.get("/", tags=["Root"])
def read_root():
    return {"message": "Welcome to the Genesis Backend!"}

if __name__ == "__main__":
    # Configuration for Uvicorn server
    # You can adjust host, port, log_level, etc. as needed
    uvicorn.run(
        "backend.server:app",  # Points to the 'app' instance in this 'server.py' file
        host="127.0.0.1",
        port=8000,
        log_level="info",
    ) 