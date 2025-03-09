import os
from typing import Dict, Any, Optional
from utils.logging import LogLevel, log
from utils.config import get_model_config, get_model_api_config

def get_default_model_id() -> str:
    """
    Get the default model ID from environment variables.
    
    Returns:
        str: The default model ID.
        
    Raises:
        ValueError: If the DEFAULT_MODEL environment variable is not set.
    """
    model_id = os.environ.get("DEFAULT_MODEL")
    if not model_id:
        log(LogLevel.ERROR, "DEFAULT_MODEL environment variable is not set")
        raise ValueError("DEFAULT_MODEL environment variable is not set")
    return model_id

def get_model_details(model_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Get the details for a specific model.
    
    Args:
        model_id (str, optional): The ID of the model to get details for.
            If not provided, uses the default model.
            
    Returns:
        Dict[str, Any]: The model details.
        
    Raises:
        ValueError: If the model is not found in the configuration.
    """
    if model_id is None:
        model_id = get_default_model_id()
    
    model_config = get_model_config(model_id)
    if not model_config:
        log(LogLevel.ERROR, f"Model {model_id} not found in configuration")
        raise ValueError(f"Model '{model_id}' not found in configuration")
    
    return model_config

def get_model_api_details(model_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Get the API details for a specific model.
    
    Args:
        model_id (str, optional): The ID of the model to get API details for.
            If not provided, uses the default model.
            
    Returns:
        Dict[str, Any]: The model API details.
        
    Raises:
        ValueError: If the model or its API is not found in the configuration.
    """
    if model_id is None:
        model_id = get_default_model_id()
    
    api_config = get_model_api_config(model_id)
    if not api_config:
        log(LogLevel.ERROR, f"API configuration for model {model_id} not found")
        raise ValueError(f"API configuration for model '{model_id}' not found")
    
    return api_config

def get_model_temperature(model_id: Optional[str] = None, user_temperature: Optional[float] = None) -> float:
    """
    Get the temperature to use for a model, considering user-provided temperature.
    
    Args:
        model_id (str, optional): The ID of the model.
            If not provided, uses the default model.
        user_temperature (float, optional): The user-provided temperature.
            If provided, this takes precedence over the model's default temperature.
            
    Returns:
        float: The temperature to use.
    """
    # If user provided a temperature, use that
    if user_temperature is not None:
        return user_temperature
    
    # Otherwise, get the model's default temperature
    model_config = get_model_details(model_id)
    return model_config.get("temperature_default", 0.7) 