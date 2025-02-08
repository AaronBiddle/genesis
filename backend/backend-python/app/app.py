from flask import Flask
from flask_socketio import SocketIO, emit
import time
import threading

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")  # Allow all origins

def background_task():
    """Background task that emits a message every second."""
    count = 0
    while count < 10:  # Send 10 messages
        socketio.emit('message', {'data': f'Message {count}'})
        time.sleep(1)
        count += 1

@socketio.on('connect')
def handle_connect():
    print('Client connected')
    # Start the background task in a new thread as soon as a client connects.
    thread = threading.Thread(target=background_task)
    thread.daemon = True
    thread.start()

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

if __name__ == '__main__':
    socketio.run(app, debug=True)