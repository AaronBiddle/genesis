# backend/router/ai_router.py
from __future__ import annotations

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Query
from pydantic import BaseModel

from backend.services.ai.models import AI_MODELS, list_by_vendor
from backend.services.ai.registry import get_provider
from backend.services.ai.base import StreamEvent, ChatResponse, MetaResponse

router = APIRouter()


# ---------------------------------------------------------------------
# Pydantic schemas for the HTTP endpoints
# ---------------------------------------------------------------------

class ModelCard(BaseModel):
    provider: str
    name: str
    display_name: str
    supports_thinking: bool


class ChatRequest(BaseModel):
    model: str
    messages: list[dict[str, str]]
    stream: bool = False
    temperature: float | None = None


class ChatReply(BaseModel):
    text: str
    meta: dict


# ---------------------------------------------------------------------
# GET /models  (already wired to your frontend)
# ---------------------------------------------------------------------

@router.get("/models", response_model=list[ModelCard])
async def list_models(
    provider: str | None = Query(None, description="Filter by provider name")
):
    models = list_by_vendor(provider) if provider else AI_MODELS
    return [ModelCard(**m.__dict__) for m in models]


# ---------------------------------------------------------------------
# POST /chat  (non‑stream, RESTful)
# ---------------------------------------------------------------------

@router.post("/chat", response_model=ChatReply)
async def chat_once(req: ChatRequest):
    """Synchronous completion – returns full text when done."""
    prov = get_provider(req.model)
    try:
        text, meta = await prov.chat(
            req.messages,
            stream=False,
            temperature=req.temperature or 0.8,
            model=req.model,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return ChatReply(text=text, meta=meta)


# ---------------------------------------------------------------------
# WebSocket /chat  (live token streaming)
# ---------------------------------------------------------------------

@router.websocket("/chat")
async def chat_socket(ws: WebSocket):
    """
    Expect a JSON payload identical to ChatRequest.
    Emits token strings as plain text; emits a final JSON line with meta.
    """
    await ws.accept()
    try:
        init: ChatRequest = ChatRequest.parse_obj(await ws.receive_json())
        prov = get_provider(init.model)

        # choose streaming or one‑shot based on the flag
        if not init.stream:
            text, meta = await prov.chat(
                init.messages,
                stream=False,
                temperature=init.temperature or 0.8,
                model=init.model,
            )
            await ws.send_json({"text": text, "meta": meta})
            await ws.close()
            return

        # streaming path
        async for ev in await prov.chat(
            init.messages,
            stream=True,
            temperature=init.temperature or 0.8,
            model=init.model,
        ):
            if ev["type"] == "text":
                await ws.send_text(ev["data"])          # incremental token
            else:  # meta
                await ws.send_json({"meta": ev["data"]})
                await ws.close()
                break

    except WebSocketDisconnect:
        pass
    except Exception as exc:
        # Bubble any adapter error to the client then close.
        await ws.send_json({"error": str(exc)})
        await ws.close(code=1011)
