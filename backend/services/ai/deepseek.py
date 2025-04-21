# backend/services/ai/deepseek.py
from __future__ import annotations

import asyncio, json, os, time
from typing import AsyncIterator, Any, Tuple

import httpx

from .base import ChatResponse, MetaResponse, StreamEvent, ChatProvider

__all__ = ["DeepSeek"]


class DeepSeek(ChatProvider):
    """
    Adapter for DeepSeek's chat‑completions endpoint.
    Implements the two‑event streaming contract:

        • yields {"type": "text", "data": <token str>}
          for every incremental delta

        • yields a single {"type": "meta", "data": {...}}
          when [DONE] is received

    Non‑streaming calls return (full_text, meta_dict).
    """

    name: str = "deepseek"

    _ENDPOINT = "https://api.deepseek.com/chat/completions"
    _API_KEY  = os.getenv("DEEPSEEK_API_KEY")
    _HEADERS  = {"Authorization": f"Bearer {_API_KEY}"} if _API_KEY else {}

    # allow two concurrent generations per connection
    _sem: asyncio.Semaphore = asyncio.Semaphore(2)

    async def chat(
        self,
        messages: list[dict[str, str]],
        *,
        stream: bool = False,
        model: str = "deepseek-chat",
        temperature: float = 0.0,
        timeout: int = 60,
        **opts: Any,
    ) -> Tuple[str, MetaResponse] | AsyncIterator[StreamEvent]:
        """
        See base.ChatProvider for semantics.
        Additional keyword args are ignored by DeepSeek
        but accepted so the call‑site can stay uniform.
        """
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "stream": stream,
        }

        async with httpx.AsyncClient(
            headers=self._HEADERS, http2=True, timeout=timeout
        ) as client:
            if not stream:
                async with self._sem:
                    t0 = time.perf_counter()
                    resp = await client.post(self._ENDPOINT, json=payload)
                resp.raise_for_status()

                full_text: str = resp.json()["choices"][0]["message"]["content"].strip()
                meta: MetaResponse = {
                    "usage": resp.json().get("usage", {}),
                    "latency": time.perf_counter() - t0,
                    "model": model,
                }
                return full_text, meta

            # ---------- streaming branch ----------
            async def generator() -> AsyncIterator[StreamEvent]:
                t0 = time.perf_counter()
                usage: dict[str, Any] | None = None
                first_token_t: float | None = None

                async with self._sem:  # queue‑depth guard
                    async with client.stream(
                        "POST", self._ENDPOINT, json=payload
                    ) as resp:
                        async for raw in resp.aiter_lines():
                            if not raw.startswith("data: "):
                                continue  # heartbeat
                            data = raw[6:]
                            if data == "[DONE]":
                                break
                            chunk = json.loads(data)

                            # DeepSeek streams one choice; delta may be ''
                            delta = chunk["choices"][0]["delta"].get("content", "")
                            if delta:
                                if first_token_t is None:
                                    first_token_t = time.perf_counter()
                                yield ChatResponse(type="text", data=delta)  # type: ignore

                            # usage shows up in each SSE chunk; capture last one
                            usage = chunk.get("usage", usage)

                meta_resp: MetaResponse = {
                    "type": "meta",
                    "data": {
                        "usage": usage or {},
                        "latency": time.perf_counter() - t0,
                        "ttfb": (
                            first_token_t - t0 if first_token_t is not None else None
                        ),
                        "model": model,
                    },
                }
                yield meta_resp

            # the outer coroutine returns the async generator
            return generator()
