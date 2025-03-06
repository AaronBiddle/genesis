#!/usr/bin/env python3
"""
Utility script to list available models from the configuration.
"""

import sys
import os
from pathlib import Path

# Add the app directory to the Python path
app_dir = Path(__file__).parent.parent
sys.path.append(str(app_dir))

from utils.config import load_models_config
from utils.logging import log, LogLevel

def main():
    """List all available models from the configuration."""
    config = load_models_config()
    
    print("\n=== Available Models ===")
    for model_id, model_config in config.get("models", {}).items():
        api_name = model_config.get("api")
        temp = model_config.get("temperature_default", "N/A")
        desc = model_config.get("description", "No description")
        
        print(f"\nModel: {model_id}")
        print(f"  API: {api_name}")
        print(f"  Default Temperature: {temp}")
        print(f"  Description: {desc}")
    
    print("\n=== Available APIs ===")
    for api_name, api_config in config.get("apis", {}).items():
        library = api_config.get("library", "N/A")
        base_url = api_config.get("base_url", "N/A")
        
        print(f"\nAPI: {api_name}")
        print(f"  Library: {library}")
        print(f"  Base URL: {base_url}")

if __name__ == "__main__":
    main() 