'''Router for frontend-specific HTTP endpoints.'''
from fastapi import APIRouter
from typing import Any

router = APIRouter()

@router.post("/echo")
def echo_data(payload: Any):
    """Receives any JSON payload and returns it unchanged."""
    return payload 