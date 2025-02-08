from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json

from routes.ai_chat import router as ai_chat_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the AI chat route
app.include_router(ai_chat_router)

async def count_to_five(websocket: WebSocket, counter_id: str):
    for i in range(1, 6):
        response = json.dumps({
            "counter": counter_id,
            "value": i
        })
        await websocket.send_text(response)
        await asyncio.sleep(1)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    running_tasks = set()

    try:
        while True:
            data = await websocket.receive_text()
            counter_id = json.loads(data)['counter']

            # Create a new counting task
            task = asyncio.create_task(count_to_five(websocket, counter_id))
            running_tasks.add(task)

            # Clean up completed tasks
            running_tasks = {t for t in running_tasks if not t.done()}

            # Add a small sleep to reduce CPU usage and fan noise
            await asyncio.sleep(0.1)  # <-- This is the key addition

    except Exception as e:
        print(f"WebSocket connection closed: {e}")
        # Cancel any running tasks when the connection closes
        for task in running_tasks:
            task.cancel()
