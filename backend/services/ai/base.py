from __future__ import annotations

from typing import Protocol, Any, AsyncIterator, Tuple, Dict, Union, TypedDict, runtime_checkable

# ---------------------------------------------------------------------
# Core data shapes for AI providers
# ---------------------------------------------------------------------

# A single message in the chat history
Message = Dict[str, str]  # keys: 'role', 'content'

# Metadata returned at the end of a completion
class MetaData(TypedDict, total=False):
    usage: Dict[str, Any]
    latency: float
    ttfb: float
    model: str

# Events streamed by providers when stream=True
class TextEvent(TypedDict):
    text: str

class ThinkingEvent(TypedDict):
    thinking: str

class MetaEvent(TypedDict):
    meta: MetaData

# One of the above per iteration
StreamEvent = Union[TextEvent, ThinkingEvent, MetaEvent]

@runtime_checkable
class ChatProvider(Protocol):
    """
    Adapter protocol for chat-completion providers.

    • stream=False → returns (full_text: str, meta: MetaData)
    • stream=True  → returns an async iterator of StreamEvent dicts
    """
    name: str

    async def chat(
        self,
        messages: list[Message],
        *,
        stream: bool = False,
        **opts: Any,
    ) -> Union[Tuple[str, MetaData], AsyncIterator[StreamEvent]]:
        ...
