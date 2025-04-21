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
from pathlib import Path
from typing import Dict

from .base import ChatProvider

_PROVIDERS: Dict[str, ChatProvider] = {}


def _load_providers() -> None:
    here = Path(__file__).parent
    for py in here.glob("*.py"):
        if py.stem in {"__init__", "base", "registry"}:
            continue
        mod = importlib.import_module(f"{__name__[:-9]}.{py.stem}")  # backend.ai.<name>
        # expect file to define a class with same capitalised stem
        cls_name = py.stem.title()          # deepseek -> Deepseek (match class name)
        if hasattr(mod, cls_name):
            inst: ChatProvider = getattr(mod, cls_name)()  # type: ignore
            _PROVIDERS[inst.name] = inst


_load_providers()


def get_provider(model_name: str) -> ChatProvider:
    """
    Map any incoming model identifier to its provider object.
    Extend the logic as you add new adapters.
    """
    if model_name.startswith("deepseek"):
        return _PROVIDERS["deepseek"]
    if model_name.startswith(("gpt", "openai")):
        return _PROVIDERS["openai"]              # adapter to be written
    if model_name.startswith(("gemini", "google")):
        return _PROVIDERS["gemini"]              # adapter to be written
    raise KeyError(f"No provider registered for model {model_name!r}")
