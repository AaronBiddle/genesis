import os
import yaml
from pathlib import Path
from typing import Dict, Any, Optional
from dotenv import load_dotenv, find_dotenv
from utils.logging import log, LogLevel

# Load environment variables
dotenv_path = find_dotenv()
load_dotenv(dotenv_path)

# Get the config directory from environment variable or use a relative path
CONFIG_DIR = os.environ.get("CONFIG_DIR")
if CONFIG_DIR:
    CONFIG_DIR = Path(CONFIG_DIR)
    log(LogLevel.DEBUGGING, f"Using CONFIG_DIR from environment: {CONFIG_DIR}")
else:
    log(LogLevel.ERROR, f"Missing CONFIG_DIR environment variable")

# Path to the models.yaml file
MODELS_CONFIG_PATH = CONFIG_DIR / "models.yaml"

# Cache for the loaded config
_models_config = None

def load_models_config() -> Dict[str, Any]:
    """
    Load the models configuration from the YAML file.
    Returns a dictionary with the configuration.
    Raises FileNotFoundError if the models.yaml file is not found.
    """
    global _models_config
    
    # Return cached config if available
    if _models_config is not None:
        return _models_config
    
    # Check if the models.yaml file exists
    if not MODELS_CONFIG_PATH.exists():
        log(LogLevel.ERROR, f"Models config file not found at {MODELS_CONFIG_PATH}")
        raise FileNotFoundError(f"Models configuration file not found: {MODELS_CONFIG_PATH}")
            
    try:
        with open(MODELS_CONFIG_PATH, 'r') as file:
            config = yaml.safe_load(file)
            
            # Process environment variables in the config
            _process_env_vars(config)
            
            # Cache the config
            _models_config = config
            return config
    except Exception as e:
        log(LogLevel.ERROR, f"Error loading models config: {str(e)}")
        raise

def _process_env_vars(config: Dict[str, Any]) -> None:
    """
    Process environment variables in the config.
    Replaces ${ENV_VAR} with the value of the environment variable.
    """
    if not config:
        return
        
    # Process APIs section
    if "apis" in config:
        for api_name, api_config in config["apis"].items():
            for key, value in api_config.items():
                if isinstance(value, str) and value.startswith("${") and value.endswith("}"):
                    env_var = value[2:-1]
                    env_value = os.environ.get(env_var)
                    if env_value:
                        api_config[key] = env_value
                    else:
                        log(LogLevel.ERROR, f"Environment variable {env_var} not found")
                        raise ValueError(f"Required environment variable {env_var} not found")

def get_model_config(model_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Get the configuration for a specific model.
    If model_id is not provided, uses the DEFAULT_MODEL from environment.
    Returns the model configuration.
    Raises ValueError if the model is not found.
    """
    if model_id is None:
        model_id = os.environ.get("DEFAULT_MODEL")
        if not model_id:
            log(LogLevel.ERROR, "DEFAULT_MODEL environment variable is not set")
            raise ValueError("DEFAULT_MODEL environment variable is not set")
    
    config = load_models_config()
    models = config.get("models", {})
    
    if model_id not in models:
        log(LogLevel.ERROR, f"Model {model_id} not found in configuration")
        raise ValueError(f"Model '{model_id}' not found in configuration")
        
    return models[model_id]

def get_api_config(api_name: str) -> Dict[str, Any]:
    """
    Get the configuration for a specific API.
    Returns the API configuration.
    Raises ValueError if the API is not found.
    """
    config = load_models_config()
    apis = config.get("apis", {})
    
    if api_name not in apis:
        log(LogLevel.ERROR, f"API {api_name} not found in configuration")
        raise ValueError(f"API '{api_name}' not found in configuration")
        
    return apis[api_name]

def get_model_api_config(model_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Get the combined model and API configuration for a model.
    If model_id is not provided, uses the DEFAULT_MODEL from environment.
    Returns a dictionary with the combined configuration.
    Raises ValueError if the model or its API is not found.
    """
    model_config = get_model_config(model_id)
    
    api_name = model_config.get("api")
    if not api_name:
        log(LogLevel.ERROR, f"API not specified for model {model_id}")
        raise ValueError(f"API not specified for model '{model_id}'")
    
    api_config = get_api_config(api_name)
    
    # Combine the configurations
    return {
        "model_id": model_config.get("model_id"),
        "temperature_default": model_config.get("temperature_default", 0.7),
        "description": model_config.get("description", ""),
        "api_key": api_config.get("api_key"),
        "base_url": api_config.get("base_url"),
        "library": api_config.get("library", "openai")
    } 