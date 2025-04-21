from __future__ import annotations

import asyncio
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Query
from pydantic import BaseModel

from backend.services.ai.models import AI_MODELS, list_by_vendor
from backend.services.ai.registry import get_provider

router = APIRouter()


# ---------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------

class ModelCard(BaseModel):
    provider: str
    name: str
    display_name: str
    supports_thinking: bool


class ChatRequest(BaseModel):
    # For WebSocket, a request_id is required; for HTTP POST it's optional
    request_id: int | None = None
    model: str
    system_prompt: str | None = None
    messages: list[dict[str, str]]
    stream: bool = False
    temperature: float | None = None

# A single, uniform envelope that works for both REST and WS that works for both REST and WS
class ChatReply(BaseModel):
    request_id: int | None = None
    text: str | None = None        # full answer or incremental token
    thinking: str | None = None    # incremental "thought" token
    meta: dict | None = None       # final metadata once per request
    error: str | None = None       # populated only on failure


# ---------------------------------------------------------------------
# GET /models
# ---------------------------------------------------------------------

@router.get("/models", response_model=list[ModelCard])
async def list_models(
    provider: str | None = Query(None, description="Filter by provider name")
):
    models = list_by_vendor(provider) if provider else AI_MODELS
    return [ModelCard(**m.__dict__) for m in models]


# ---------------------------------------------------------------------
# POST /chat  (non‑stream, one‑shot)
# ---------------------------------------------------------------------

@router.post("/chat", response_model=ChatReply)
async def chat_once(req: ChatRequest):
    prov = get_provider(req.model)

    # build message list, injecting system prompt if provided
    msgs: list[dict[str, str]] = []
    if req.system_prompt:
        msgs.append({"role": "system", "content": req.system_prompt})
    msgs.extend(req.messages)

    try:
        text, meta = await prov.chat(
            msgs,
            stream=False,
            temperature=req.temperature or 0.8,
            model=req.model,
        )
        return ChatReply(request_id=req.request_id, text=text, meta=meta)

    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


# ---------------------------------------------------------------------
# ---------------------------------------------------------------------
# WebSocket /chat  (persistent, multiplexed)
# ---------------------------------------------------------------------

@router.websocket("/chat")
async def chat_socket(ws: WebSocket):
    await ws.accept()
    active_tasks: set[asyncio.Task] = set()

    async def handle_request(init: ChatRequest):
        prov = get_provider(init.model)

        msgs: list[dict[str, str]] = []
        if init.system_prompt:
            msgs.append({"role": "system", "content": init.system_prompt})
        msgs.extend(init.messages)

        async def send(reply: ChatReply):
            # Must await send_json to ensure the message is transmitted and errors propagated
            await ws.send_json(reply.model_dump(exclude_none=True))

        try:
            # non‑stream: single reply
            if not init.stream:
                text, meta = await prov.chat(
                    msgs,
                    stream=False,
                    temperature=init.temperature or 0.8,
                    model=init.model,
                )
                await send(ChatReply(request_id=init.request_id, text=text, meta=meta))
                return

            # stream: incremental replies; adapters now emit flat dicts with 'text', 'thinking', or 'meta'
            async for ev in prov.chat(
                msgs,
                stream=True,
                temperature=init.temperature or 0.8,
                model=init.model,
            ):
                # ev is a dict: {'text': ..., 'thinking': ..., or 'meta': ...}
                payload = {"request_id": init.request_id, **ev}
                await ws.send_json(payload)
        except Exception as exc:
            # send error envelope
            await send(ChatReply(request_id=init.request_id, error=str(exc)))

    try:
        while True:
            data = await ws.receive_json()
            init = ChatRequest.model_validate(data)
            task = asyncio.create_task(handle_request(init))
            active_tasks.add(task)
            task.add_done_callback(active_tasks.discard)

    except WebSocketDisconnect:
        for t in active_tasks:
            t.cancel()
    except Exception as exc:
        # on fatal errors, send and close
        await ws.send_json({"error": str(exc)})
        await ws.close(code=1011)
