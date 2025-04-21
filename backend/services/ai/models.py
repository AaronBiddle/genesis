# backend/services/ai/models.py
from dataclasses import dataclass
from typing import List

@dataclass(frozen=True)
class ModelInfo:
    provider: str      # "deepseek", "gemini", ...
    name: str          # model identifier used in payloads
    display_name: str  # user‑facing label
    supports_thinking: bool  # True if the provider returns “thought” chunks

AI_MODELS: List[ModelInfo] = [
    ModelInfo("deepseek", "deepseek-chat",       "DeepSeek Chat",     False),
    ModelInfo("deepseek", "deepseek-reasoner",   "DeepSeek Reasoner", True),
    ModelInfo("gemini",   "gemini-2.5-pro-preview-03-25", "Gemini 2.5 Pro (Paid)", False),
    ModelInfo("gemini",   "gemini-2.5-pro-exp-03-25",     "Gemini 2.5 Pro",        False),
    ModelInfo("gemini",   "gemini-2.0-flash",             "Gemini 2.0 Flash",      False),
]

# quick lookup helpers
_by_name   = {m.name: m for m in AI_MODELS}
_by_vendor = {}
for m in AI_MODELS:
    _by_vendor.setdefault(m.provider, []).append(m)

def get(model_name: str) -> ModelInfo:
    return _by_name[model_name]

def list_by_vendor(vendor: str):
    return _by_vendor.get(vendor, [])
