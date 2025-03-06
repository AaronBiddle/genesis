from fastapi import APIRouter, HTTPException
from typing import Dict, List, Any
from utils.config import load_models_config
from utils.logging import log, LogLevel

router = APIRouter()

@router.get("/api/models", response_model=Dict[str, Any])
async def get_models():
    """
    Get all available models and their configurations.
    Returns a dictionary with model information that can be used by the frontend.
    """
    try:
        # Load the models configuration
        config = load_models_config()
        
        # Extract models data
        models_data = config.get("models", {})
        
        # Create a response with only the information needed by the frontend
        response = {
            "models": {}
        }
        
        for model_id, model_config in models_data.items():
            response["models"][model_id] = {
                "id": model_id,
                "name": model_id,  # Using model_id as name, could be customized
                "description": model_config.get("description", ""),
                "temperature_default": model_config.get("temperature_default", 0.7)
            }
        
        log(LogLevel.MINIMUM, f"Retrieved {len(response['models'])} models")
        return response
        
    except Exception as e:
        log(LogLevel.ERROR, f"Error retrieving models: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving models: {str(e)}") 