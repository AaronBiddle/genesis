# backend/services/ai/registry.py
"""
Simple one‑shot registry that discovers provider modules in the
backend.ai package and maps a model‑name prefix to an adapter.

Usage
-----
    from backend.ai.registry import get_provider

    provider = get_provider("deepseek-chat")   # returns DeepSeek()
    stream   = provider.chat(msgs, stream=True)
"""

from __future__ import annotations

import importlib
import inspect  # Import inspect module
from pathlib import Path
from typing import Dict, Type # Import Type

from .base import ChatProvider

_PROVIDERS: Dict[str, ChatProvider] = {}


def _load_providers() -> None:
    here = Path(__file__).parent
    for py in here.glob("*.py"):
        if py.stem in {"__init__", "base", "registry"}:
            continue
        try:
            module_name = f"{__name__[:-9]}.{py.stem}" # backend.services.ai.<name>
            mod = importlib.import_module(module_name)

            found_provider_class = None
            for name, obj in inspect.getmembers(mod):
                # Check if it's a class defined in this module (not imported)
                # and structurally looks like a ChatProvider (has name attr and chat method)
                if inspect.isclass(obj) and \
                   obj.__module__ == module_name and \
                   hasattr(obj, 'name') and \
                   hasattr(obj, 'chat') and \
                   callable(getattr(obj, 'chat', None)):
                   # We don't check 'obj is not ChatProvider' because ChatProvider itself won't be in the module
                   found_provider_class = obj
                   break # Assume one provider class per file

            if found_provider_class:
                ProviderClass: Type[ChatProvider] = found_provider_class # Type hint
                inst = ProviderClass()
                if hasattr(inst, 'name') and inst.name: # Double check instance has name
                    _PROVIDERS[inst.name] = inst

        except Exception as e:
            print(f"  ERROR loading provider from {py.name}: {e}") # Keep error reporting


    print(f"Registry contains: {list(_PROVIDERS.keys())}")


_load_providers()


def get_provider(model_name: str) -> ChatProvider:
    """
    Map any incoming model identifier to its provider object.
    Extend the logic as you add new adapters.
    """
    if model_name.startswith("deepseek"):
        provider = _PROVIDERS["deepseek"]
        return provider
    if model_name.startswith(("gpt", "openai")):
        provider = _PROVIDERS["openai"]
        return provider
    if model_name.startswith(("gemini", "google")):
        provider = _PROVIDERS["gemini"]
        return provider
    raise KeyError(f"No provider registered for model {model_name!r}")
