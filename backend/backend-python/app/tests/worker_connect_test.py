import asyncio
import websockets
import json
import sys

# Test for the worker connection
async def worker_connection():
    uri = 'ws://localhost:8000/ws/worker-connect'
    async with websockets.connect(uri) as websocket:
        print("Worker connected to server")
        
        # Send an initial heartbeat
        await websocket.send("WORKER_HEARTBEAT")
        print("Sent initial heartbeat")
        
        # Set up a task to send heartbeats regularly
        heartbeat_task = asyncio.create_task(send_heartbeats(websocket))
        
        # Keep the connection alive and handle any messages
        try:
            while True:
                # Wait for messages from the server
                message = await websocket.recv()
                print(f'Worker received: {message}')
                
                # Only respond to non-acknowledgment messages to avoid echo loops
                if not message.startswith("Acknowledged:"):
                    try:
                        # Try to parse as JSON
                        data = json.loads(message)
                        # Check if this is a request from the frontend
                        if "request_from_frontend" in data:
                            frontend_text = data["request_from_frontend"]
                            print(f"Processing frontend request: {frontend_text}")
                            
                            # Send a response back
                            await websocket.send(f"Worker processed: {frontend_text}")
                    except json.JSONDecodeError:
                        # Non-JSON, non-acknowledgment message - no need to respond
                        pass
        except Exception as e:
            print(f"Error in worker connection: {str(e)}")
        finally:
            # Cancel the heartbeat task when the main task ends
            heartbeat_task.cancel()

# Separate task to send heartbeats on a regular schedule
async def send_heartbeats(websocket):
    try:
        while True:
            await asyncio.sleep(30)  # Send a heartbeat every 30 seconds
            await websocket.send("WORKER_HEARTBEAT")
            print("Sent heartbeat")
    except asyncio.CancelledError:
        # Task was cancelled, exit gracefully
        pass
    except Exception as e:
        print(f"Error in heartbeat task: {str(e)}")

# Test for the frontend requests
async def frontend_request():
    uri = 'ws://localhost:8000/ws/frontend-requests'
    async with websockets.connect(uri) as websocket:
        counter = 1
        while True:
            try:
                # Create a message with the required "text" field
                message = {"text": f"Frontend request {counter}"}
                
                # Send the message as JSON
                await websocket.send(json.dumps(message))
                print(f'Frontend sent: {message}')
                
                # Wait for the response
                response = await websocket.recv()
                print(f'Frontend received response: {response}')
                
                counter += 1
                await asyncio.sleep(5)  # Wait 5 seconds between requests
            except Exception as e:
                print(f"Error in frontend request: {str(e)}")
                break

async def main():
    # Check command line arguments to determine which test to run
    if len(sys.argv) > 1 and sys.argv[1] == "frontend":
        print("Running frontend request test...")
        await frontend_request()
    else:
        print("Running worker connection test...")
        await worker_connection()

if __name__ == '__main__':
    asyncio.run(main()) 