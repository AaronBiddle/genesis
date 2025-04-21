# backend/router/ai_router.py
from fastapi import APIRouter, Query
from pydantic import BaseModel

from backend.services.ai.models import AI_MODELS, list_by_vendor

router = APIRouter()


# ---------- schema the frontend will see -------------------------------
class ModelCard(BaseModel):
    provider: str
    name: str
    display_name: str
    supports_thinking: bool


# ---------- public catalogue endpoint ----------------------------------
@router.get("/models", response_model=list[ModelCard])
async def list_models(
    provider: str | None = Query(
        None, description="If given, filter models to this provider"
    )
):
    """Return the catalogue of LLMs the backend can serve."""
    models = list_by_vendor(provider) if provider else AI_MODELS
    return [ModelCard(**m.__dict__) for m in models]
