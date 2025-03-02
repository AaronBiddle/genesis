import asyncio
import websockets
import logging
import threading
import time
import queue
import base64
import io
from PIL import Image
import json
import bottle

# Global progress queue for communication between threads
progress_queue = queue.Queue()


def run_hardcoded_process(report_progress=None, message=None):
    logging.info('Executing the hard-coded process...')
    
    try:
        # Parse the JSON message
        message_data = json.loads(message)
        
        # Extract the request content
        request_content = message_data.get("request_from_frontend", "")
        
        if report_progress:
            report_progress(f"Processing request: {request_content}")
        
        # Import bottle and run with the extracted content
        bottle.main(progress_callback=report_progress, prompt=request_content)
        
    except Exception as e:
        error_msg = f"Error processing message: {str(e)}"
        logging.error(error_msg)
        if report_progress:
            report_progress(f"ERROR: {error_msg}")


# Function to encode image to base64 for sending over WebSocket
def encode_image_to_base64(image):
    """Convert a PIL Image to base64 string."""
    buffered = io.BytesIO()
    image.save(buffered, format="JPEG", quality=80)  # Use lower quality for preview
    img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
    return img_str


class HeartbeatThread(threading.Thread):
    def __init__(self, websocket_url):
        super().__init__(daemon=True)
        self.websocket_url = websocket_url
        self.running = True
        self.connected = False
        self.websocket = None
        
    async def connect_and_heartbeat(self):
        async with websockets.connect(self.websocket_url) as websocket:
            self.websocket = websocket
            self.connected = True
            logging.info('Heartbeat thread connected to server')
            
            # Send initial heartbeat
            await websocket.send('WORKER_HEARTBEAT')
            
            while self.running:
                try:
                    await asyncio.sleep(30)  # Send a heartbeat every 30 seconds
                    await websocket.send('WORKER_HEARTBEAT')
                except Exception as e:
                    logging.error(f'Error in heartbeat: {str(e)}')
                    self.connected = False
                    break
    
    def run(self):
        asyncio.run(self.connect_and_heartbeat())


async def worker_connection():
    uri = 'ws://localhost:8000/ws/worker-connect'
    
    # Start heartbeat in a separate thread
    heartbeat_thread = HeartbeatThread(uri)
    heartbeat_thread.start()
    
    # Wait for heartbeat thread to establish connection
    while not heartbeat_thread.connected:
        await asyncio.sleep(0.1)
    
    # Main worker connection
    async with websockets.connect(uri) as websocket:
        logging.info('Worker connected to server')
        
        # Start a task to monitor the progress queue and send updates
        progress_task = asyncio.create_task(monitor_progress_queue(websocket))
        
        try:
            while True:
                message = await websocket.recv()
                logging.debug(f'Worker received message: {message[:50]}...' if len(message) > 50 else message)
                
                # Only respond if the message is not an acknowledgment
                if not message.startswith("Acknowledged:"):
                    # Send a response indicating we received the message
                    await websocket.send(f'Worker received message: "{message}"')
                    
                    # Define a progress reporting function that can handle both text and images
                    def report_progress(progress_data):
                        """
                        Report progress to the frontend.
                        
                        Args:
                            progress_data: Either a string message or a tuple (message, image)
                                          where image is a PIL Image object
                        """
                        # Add the progress message to the queue
                        progress_queue.put(progress_data)
                    
                    # Process the message
                    run_hardcoded_process(report_progress=report_progress, message=message)
                    
                    # After processing is complete, send a completion message
                    await websocket.send(f'Worker completed processing message: "{message}"')
        except Exception as e:
            logging.error(f'Error in worker connection: {str(e)}')
        finally:
            progress_task.cancel()
            heartbeat_thread.running = False


async def monitor_progress_queue(websocket):
    """Monitor the progress queue and send updates through the websocket."""
    while True:
        try:
            # Check if there are any progress updates to send
            # Non-blocking to allow this task to be cancelled
            try:
                progress_data = progress_queue.get_nowait()
                
                # Check if the progress data is a tuple (message, image)
                if isinstance(progress_data, tuple) and len(progress_data) == 2:
                    message, image = progress_data
                    
                    # If image is a PIL Image, convert it to base64
                    if hasattr(image, 'save'):  # Check if it's a PIL Image
                        image_data = encode_image_to_base64(image)
                        await websocket.send(f"PROGRESS_IMAGE:{message}:{image_data}")
                        logging.debug(f"Sent progress update with image")
                    else:
                        # If not a valid image, just send the message
                        await websocket.send(f"PROGRESS:{message}")
                        logging.debug(f"Sent progress update")
                else:
                    # Regular text progress update
                    await websocket.send(f"PROGRESS:{progress_data}")
                    logging.debug(f"Sent progress update")
                    
            except queue.Empty:
                pass
            
            # Small sleep to prevent CPU spinning
            await asyncio.sleep(0.1)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logging.error(f"Error in progress monitor: {str(e)}")
            await asyncio.sleep(1)  # Wait a bit before retrying


async def main():
    await worker_connection()


if __name__ == '__main__':
    # Set default logging to INFO, but use DEBUG for more detailed logs if needed
    logging.basicConfig(level=logging.INFO, 
                        format='%(asctime)s - %(levelname)s - %(message)s')
    asyncio.run(main()) 