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
import uuid
import importlib

# Global queues and storage
progress_queue = queue.Queue()
task_queues = {}  # Dictionary of queues for different handlers
results_storage = {}  # Store results by request_id
results_lock = threading.Lock()  # Lock for thread-safe access

# Handler registry
handler_registry = {}

def register_handler(name, handler_class, concurrent=False, max_workers=1):
    """
    Register a new handler in the system.
    
    Args:
        name: The name of the handler (used in requests)
        handler_class: The class that implements the handler
        concurrent: Whether this handler can process requests concurrently
        max_workers: Maximum number of worker threads for this handler
    """
    handler_registry[name] = {
        'class': handler_class,
        'concurrent': concurrent,
        'max_workers': max_workers,
        'instances': []
    }
    
    # Create a queue for this handler
    task_queues[name] = queue.Queue()
    
    # Start worker threads if this is a concurrent handler
    if concurrent:
        for _ in range(max_workers):
            worker = HandlerThread(name, handler_class)
            worker.start()
            handler_registry[name]['instances'].append(worker)
    
    logging.info(f"Registered handler: {name} (concurrent={concurrent}, max_workers={max_workers})")

class HandlerThread(threading.Thread):
    """Thread that processes tasks for a specific handler."""
    
    def __init__(self, handler_name, handler_class):
        super().__init__(daemon=True)
        self.handler_name = handler_name
        self.handler_class = handler_class
        self.running = True
        
    def run(self):
        handler_instance = self.handler_class()
        
        while self.running:
            try:
                # Get the next task from the queue
                request_id, params = task_queues[self.handler_name].get(timeout=1.0)
                
                try:
                    logging.info(f"Processing {self.handler_name} request: {request_id}")
                    
                    # Create a progress callback for this request
                    def report_progress(progress_data):
                        # Add request_id to the progress data
                        progress_queue.put((request_id, progress_data))
                    
                    # Process the request
                    result = handler_instance.process(params, report_progress)
                    
                    # Store the result
                    with results_lock:
                        results_storage[request_id] = {
                            "status": "success",
                            "handler": self.handler_name,
                            "result": result
                        }
                        
                except Exception as e:
                    logging.error(f"Error processing {self.handler_name} request {request_id}: {str(e)}")
                    with results_lock:
                        results_storage[request_id] = {
                            "status": "error",
                            "handler": self.handler_name,
                            "error": str(e)
                        }
                
                # Mark the task as done
                task_queues[self.handler_name].task_done()
                
            except queue.Empty:
                # No tasks in queue, just continue
                pass
            except Exception as e:
                logging.error(f"Error in {self.handler_name} handler thread: {str(e)}")

# Base handler class that all handlers should extend
class BaseHandler:
    def process(self, params, progress_callback=None):
        """
        Process a request with the given parameters.
        
        Args:
            params: Dictionary of parameters for this request
            progress_callback: Function to call with progress updates
            
        Returns:
            The result of processing (handler-specific)
        """
        raise NotImplementedError("Handlers must implement process()")

# Example handlers
class ImageGenerationHandler(BaseHandler):
    def process(self, params, progress_callback=None):
        if progress_callback:
            progress_callback(f"Starting image generation with prompt: {params.get('prompt', '')}")
        
        # Import bottle and run with the parameters
        import bottle
        result = bottle.main(
            progress_callback=progress_callback, 
            prompt=params.get('prompt', ''),
            style=params.get('style', 'default'),
            width=params.get('width', 512),
            height=params.get('height', 512)
        )
        
        return result

class ImageLoadHandler(BaseHandler):
    def process(self, params, progress_callback=None):
        file_path = params.get('path', '')
        
        if not file_path:
            raise ValueError("No file path provided")
            
        if progress_callback:
            progress_callback(f"Loading image from: {file_path}")
        
        # Load the image using PIL
        image = Image.open(file_path)
        
        # Convert to base64 for returning
        buffered = io.BytesIO()
        image.save(buffered, format="JPEG")
        img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
        
        return {
            "width": image.width,
            "height": image.height,
            "format": image.format,
            "image_data": img_str
        }

# Function to encode image to base64 for sending over WebSocket
def encode_image_to_base64(image):
    """Convert a PIL Image to base64 string."""
    buffered = io.BytesIO()
    image.save(buffered, format="JPEG", quality=80)
    img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
    return img_str

def process_request(message):
    """
    Process an incoming request message.
    
    Args:
        message: The JSON message from the frontend/client
        
    Returns:
        request_id: The ID of the request for tracking
    """
    try:
        # Parse the message
        request_data = json.loads(message)
        
        # Extract request components
        request_id = request_data.get('request_id', str(uuid.uuid4()))
        handler_name = request_data.get('handler', '')
        params = request_data.get('params', {})
        
        if not handler_name:
            raise ValueError("No handler specified in request")
            
        if handler_name not in handler_registry:
            raise ValueError(f"Unknown handler: {handler_name}")
        
        handler_info = handler_registry[handler_name]
        
        # Add the request to the appropriate queue
        if handler_info['concurrent']:
            # For concurrent handlers, add to the queue and return immediately
            task_queues[handler_name].put((request_id, params))
            logging.info(f"Queued concurrent request {request_id} for handler {handler_name}")
        else:
            # For non-concurrent handlers, process in the main thread
            logging.info(f"Processing non-concurrent request {request_id} for handler {handler_name}")
            
            # Create a handler instance
            handler_instance = handler_info['class']()
            
            # Create a progress callback
            def report_progress(progress_data):
                progress_queue.put((request_id, progress_data))
            
            try:
                # Process the request
                result = handler_instance.process(params, report_progress)
                
                # Store the result
                with results_lock:
                    results_storage[request_id] = {
                        "status": "success",
                        "handler": handler_name,
                        "result": result
                    }
            except Exception as e:
                logging.error(f"Error processing {handler_name} request {request_id}: {str(e)}")
                with results_lock:
                    results_storage[request_id] = {
                        "status": "error",
                        "handler": handler_name,
                        "error": str(e)
                    }
        
        return request_id
        
    except Exception as e:
        logging.error(f"Error processing request: {str(e)}")
        # Generate a request ID for the error
        error_id = str(uuid.uuid4())
        with results_lock:
            results_storage[error_id] = {
                "status": "error",
                "handler": "system",
                "error": f"Failed to process request: {str(e)}"
            }
        return error_id

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
    
    # Register handlers
    register_handler("generate_image", ImageGenerationHandler, concurrent=False)
    register_handler("load_image", ImageLoadHandler, concurrent=True, max_workers=3)
    
    # Start heartbeat thread
    heartbeat_thread = HeartbeatThread(uri)
    heartbeat_thread.start()
    
    # Wait for heartbeat thread to establish connection
    while not heartbeat_thread.connected:
        await asyncio.sleep(0.1)
    
    # Main worker connection
    async with websockets.connect(uri) as websocket:
        logging.info('Worker connected to server')
        
        # Start tasks to monitor queues and send updates
        progress_task = asyncio.create_task(monitor_progress_queue(websocket))
        results_task = asyncio.create_task(monitor_results(websocket))
        
        try:
            while True:
                message = await websocket.recv()
                logging.debug(f'Worker received message: {message[:50]}...' if len(message) > 50 else message)
                
                # Only respond if the message is not an acknowledgment
                if not message.startswith("Acknowledged:"):
                    # Send a response indicating we received the message
                    await websocket.send(f'Worker received message: "{message}"')
                    
                    # Process the request
                    request_id = process_request(message)
                    
                    # Send an acknowledgment with the request ID
                    await websocket.send(f"REQUEST_ACCEPTED:{request_id}")
        except Exception as e:
            logging.error(f'Error in worker connection: {str(e)}')
        finally:
            progress_task.cancel()
            results_task.cancel()
            heartbeat_thread.running = False
            
            # Stop all handler threads
            for handler_info in handler_registry.values():
                for thread in handler_info['instances']:
                    thread.running = False

async def monitor_progress_queue(websocket):
    """Monitor the progress queue and send updates through the websocket."""
    while True:
        try:
            # Check if there are any progress updates to send
            try:
                progress_item = progress_queue.get_nowait()
                
                if isinstance(progress_item, tuple) and len(progress_item) == 2:
                    request_id, progress_data = progress_item
                    
                    # Check if the progress data is a tuple (message, image)
                    if isinstance(progress_data, tuple) and len(progress_data) == 2:
                        message, image = progress_data
                        
                        # If image is a PIL Image, convert it to base64
                        if hasattr(image, 'save'):
                            image_data = encode_image_to_base64(image)
                            await websocket.send(f"PROGRESS_IMAGE:{request_id}:{message}:{image_data}")
                        else:
                            await websocket.send(f"PROGRESS:{request_id}:{progress_data}")
                    else:
                        # Regular text progress update
                        await websocket.send(f"PROGRESS:{request_id}:{progress_data}")
                else:
                    # Legacy format without request_id
                    await websocket.send(f"PROGRESS:{progress_item}")
                    
            except queue.Empty:
                pass
            
            await asyncio.sleep(0.1)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logging.error(f"Error in progress monitor: {str(e)}")
            await asyncio.sleep(1)

async def monitor_results(websocket):
    """Monitor the results storage and send completed results."""
    while True:
        try:
            # Get a copy of the current results
            with results_lock:
                current_results = dict(results_storage)
                
            for request_id, result in current_results.items():
                # Send the result
                await websocket.send(f"RESULT:{request_id}:{json.dumps(result)}")
                logging.info(f"Sent result for request {request_id}")
                
                # Remove from storage
                with results_lock:
                    if request_id in results_storage:
                        del results_storage[request_id]
            
            await asyncio.sleep(0.1)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logging.error(f"Error in results monitor: {str(e)}")
            await asyncio.sleep(1)

async def main():
    await worker_connection()

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO, 
                        format='%(asctime)s - %(levelname)s - %(message)s')
    asyncio.run(main()) 