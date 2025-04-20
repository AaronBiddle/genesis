from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from typing import Any, Dict
import asyncio

from backend.services.ai import ai_operations

router = APIRouter()

@router.websocket("/ws/generate")
async def websocket_generate(websocket: WebSocket):
    # To support multiple simultaneous connections without blocking,
    # ensure that ai_operations.generate_streaming_response is an async generator
    # performing non-blocking I/O. If it contains CPU-bound or blocking code,
    # wrap those parts in asyncio.to_thread or a threadpool executor.
    await websocket.accept()
    try:
        init_payload: Dict[str, Any] = await websocket.receive_json()
        request_id = init_payload.get("requestId")
        model = init_payload.get("model")
        messages = init_payload.get("messages")

        if not all([request_id, model, messages]):
            await websocket.send_json({
                "requestId": request_id,
                "error": "`requestId`, `model` and `messages` are required to start the stream."
            })
            await websocket.close(code=1000)
            return

        # Async generator for streaming partial responses
        stream = ai_operations.generate_streaming_response(
            model=model,
            messages=messages,
            system_prompt=init_payload.get("system_prompt"),
            temperature=init_payload.get("temperature"),
            max_tokens=init_payload.get("max_tokens"),
            request_id=request_id,
        )

        # Forward each chunk; yielding control back to the event loop each iteration
        async for chunk in stream:
            await websocket.send_json({
                "requestId": request_id,
                "delta": chunk
            })
            # slight pause to allow other tasks to run
            await asyncio.sleep(0)

        # Signal completion
        await websocket.send_json({
            "requestId": request_id,
            "done": True
        })
        await websocket.close()

    except WebSocketDisconnect:
        # Client disconnected; cleanup happens automatically
        print(f"Client disconnected for request {request_id}")
    except Exception as e:
        print(f"Error in websocket_generate: {e}")
        try:
            await websocket.send_json({
                "requestId": request_id,
                "error": "Internal server error during streaming."
            })
            await websocket.close(code=1011)
        except:
            pass
