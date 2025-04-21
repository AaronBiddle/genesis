from typing import TypedDict, Literal, AsyncIterator, Protocol, Any, Union

class ChatResponse(TypedDict):
    type: Literal["text"]           # fixed discriminator
    data: str                       # token text or full answer chunk

class MetaResponse(TypedDict):
    type: Literal["meta"]
    data: dict[str, Any]            # usage, finish_reason, model, etc.

StreamEvent = Union[ChatResponse, MetaResponse]

class ChatProvider(Protocol):
    name: str

    async def chat(
        self,
        messages: list[dict[str, str]],
        *,
        stream: bool = False,
        **opts: Any
    ) -> AsyncIterator[StreamEvent] | tuple[str, dict[str, Any]]:
        """
        • stream=False → return (full_text, meta_dict)
        • stream=True  → yield StreamEvent objects; exactly one
                         MetaResponse appears at the end.
        """
