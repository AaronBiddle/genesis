from fastapi import APIRouter, HTTPException, Body
from typing import Any, Dict

from backend.services.ai import ai_operations

router = APIRouter()

@router.get("/get_models")
async def get_available_models():
    try:
        models = ai_operations.get_models()
        if not models:
            raise HTTPException(status_code=404, detail="No AI models found.")
        return {"models": models}
    except Exception as e:
        print(f"Error fetching models: {e}")
        raise HTTPException(status_code=500, detail="Internal server error fetching AI models.")

@router.post("/generate_response")
async def generate_ai_response(request: Dict[str, Any] = Body(...)):
    """
    Expects a JSON body with at least:
    {
        "model": "model-name",
        "messages": [...],
        // optional: system_prompt, temperature, max_tokens
    }
    """
    try:
        model = request.get("model")
        messages = request.get("messages")
        if model is None or messages is None:
            raise HTTPException(status_code=400, detail="`model` and `messages` are required fields.")

        response_data = await ai_operations.generate_response(
            model=model,
            messages=messages,
            system_prompt=request.get("system_prompt"),
            temperature=request.get("temperature"),
            max_tokens=request.get("max_tokens"),
        )

        if response_data is None:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to generate response from model '{model}'."
            )

        return response_data

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating response: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during AI response generation.")
