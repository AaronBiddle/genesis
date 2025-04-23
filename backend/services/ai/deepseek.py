from __future__ import annotations

import json, os, time
from typing import AsyncIterator, Any, Dict, Tuple, Union

import httpx
from dotenv import load_dotenv

from .base import StreamEvent, MetaData, Message, ChatProvider

load_dotenv()

__all__ = ["DeepSeek"]


class DeepSeek(ChatProvider):
    """Adapter for DeepSeek's chat-completions endpoint."""

    name: str = "deepseek"

    _ENDPOINT = "https://api.deepseek.com/chat/completions"
    _API_KEY = os.getenv("DEEPSEEK_API_KEY")
    _HEADERS = {"Authorization": f"Bearer {_API_KEY}"} if _API_KEY else {}

    async def chat(
        self,
        messages: list[Message],
        *,
        stream: bool = False,
        model: str = "deepseek-chat",
        temperature: float = 0.0,
        timeout: int = 60,
        **opts: Any,
    ) -> Union[Tuple[str, MetaData], AsyncIterator[StreamEvent]]:
        """Implements ChatProvider for DeepSeek."""

        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "stream": bool(stream),
        }

        if not stream:
            # Non-streaming request
            async with httpx.AsyncClient(
                headers=self._HEADERS, http2=True, timeout=timeout
            ) as client:
                t0 = time.perf_counter()
                resp = await client.post(self._ENDPOINT, json=payload)
                resp.raise_for_status()
                data = resp.json()

            text = data["choices"][0]["message"]["content"].strip()
            meta: MetaData = {
                "usage": data.get("usage", {}),
                "latency": time.perf_counter() - t0,
                "model": model,
            }
            return text, meta

        # Streaming request
        return self._stream_generator(payload, timeout, model)

    def _stream_generator(
        self, payload: dict, timeout: int, model: str
    ) -> AsyncIterator[StreamEvent]:
        async def gen() -> AsyncIterator[StreamEvent]:
            async with httpx.AsyncClient(
                headers=self._HEADERS, http2=True, timeout=timeout
            ) as client:
                t0 = time.perf_counter()
                first_token_t: float | None = None
                usage: Dict[str, Any] | None = None

                async with client.stream("POST", self._ENDPOINT, json=payload) as resp:
                    resp.raise_for_status()
                    async for raw in resp.aiter_lines():
                        if not raw.startswith("data: "):
                            continue  # heartbeat
                        content = raw[6:]
                        if content == "[DONE]":
                            break
                        chunk = json.loads(content)
                        delta = chunk.get("choices", [{}])[0].get("delta", {})

                        # emit thinking tokens first if present
                        reasoning_content = delta.get("reasoning_content")
                        if reasoning_content:
                            yield {"thinking": reasoning_content}  # internal reasoning token

                        # then emit user-visible content
                        text = delta.get("content")
                        if text:
                            if first_token_t is None:
                                first_token_t = time.perf_counter()
                            yield {"text": text}  # user token

                        # capture usage if present
                        if "usage" in chunk:
                            usage = chunk["usage"]

                meta: MetaData = {
                    "usage": usage or {},
                    "latency": time.perf_counter() - t0,
                    "ttfb": (first_token_t - t0) if first_token_t else None,
                    "model": model,
                }
                yield {"meta": meta}  # final metadata

        return gen()
