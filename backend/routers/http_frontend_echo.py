'''Router for frontend-specific HTTP endpoints.'''
from fastapi import APIRouter
from typing import Any

router = APIRouter()

@router.post("/")
def echo_data(payload: dict):
    """Receives any JSON object (dictionary) and returns it unchanged."""
    return payload 