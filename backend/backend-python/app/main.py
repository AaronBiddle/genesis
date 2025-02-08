from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import chat
from config import get_settings
from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS
from services.socket_service import SocketService

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

# Initialize Flask and SocketIO
flask_app = Flask(__name__)
flask_app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(flask_app, cors_allowed_origins="*")

# Initialize socket service
socket_service = SocketService(socketio)
socket_service.init_handlers()

@app.get("/")
async def root():
    return {"message": "Welcome to Genesis Backend API"}

# Modified run block
if __name__ == '__main__':
    socketio.run(flask_app, debug=True)