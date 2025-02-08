import threading
import time
from flask_socketio import emit
from services.chat_service import ChatService
from models.chat import ChatRequest

class SocketService:
    def __init__(self, socketio):
        self.socketio = socketio
        self.chat_service = ChatService()

    def background_task(self):
        """Background task that emits a message every second."""
        count = 0
        while count < 10:  # Send 10 messages
            self.socketio.emit('message', {'data': f'Message {count}'})
            self.socketio.sleep(1)
            count += 1

    def init_handlers(self):
        """Initialize all socket event handlers."""
        
        @self.socketio.on('connect')
        def handle_connect():
            print('Client connected')
            # Start the background task in a new thread
            thread = threading.Thread(target=self.background_task)
            thread.daemon = True
            thread.start()

        @self.socketio.on('disconnect')
        def handle_disconnect():
            print('Client disconnected')

        # You can add more handlers here, for example:
        @self.socketio.on('chat_message')
        async def handle_chat_message(data):
            try:
                request = ChatRequest(messages=data['messages'])
                # Iterate over the streamed tokens and emit them incrementally
                async for token in self.chat_service.process_message_stream(request):
                    self.socketio.emit('chat_response', {'response': token})
                    # Yield control so the client can receive the token while processing the rest
                    await self.socketio.sleep(0)
            except Exception as e:
                print(f"Error processing chat message: {e}")
                self.socketio.emit('error', {'message': 'Error processing message'})