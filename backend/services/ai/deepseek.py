# backend/services/ai/deepseek.py
from __future__ import annotations

import asyncio, json, os, time
from typing import AsyncIterator, Any, Tuple

import httpx

from .base import ChatResponse, MetaResponse, StreamEvent, ChatProvider
from dotenv import load_dotenv

load_dotenv()

__all__ = ["DeepSeek"]


class DeepSeek(ChatProvider):
    """
    Adapter for DeepSeek's chat-completions endpoint.
    Implements the two-event streaming contract:

        • yields {"type": "text", "data": <token str>}
          for every incremental delta

        • yields a single {"type": "meta", "data": {...}}
          when [DONE] is received

    Non-streaming calls return (full_text, meta_dict).
    """

    name: str = "deepseek"

    _ENDPOINT = "https://api.deepseek.com/chat/completions"
    _API_KEY  = os.getenv("DEEPSEEK_API_KEY")
    _HEADERS  = {"Authorization": f"Bearer {_API_KEY}"} if _API_KEY else {}

    # allow two concurrent generations per connection
    _sem: asyncio.Semaphore = asyncio.Semaphore(10)

    async def chat(
        self,
        messages: list[dict[str, str]],
        *,
        stream: bool = True,
        model: str = "deepseek-chat",
        temperature: float = 0.0,
        timeout: int = 60,
        **opts: Any,
    ) -> Tuple[str, MetaResponse] | AsyncIterator[StreamEvent]:
        """
        See base.ChatProvider for semantics.
        Additional keyword args are ignored by DeepSeek
        but accepted so the call-site can stay uniform.
        """
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "stream": stream,
        }
        print(f"[DeepSeek] Sending payload (stream={stream}): {payload}") # LOGGING

        # Use a single client instance
        async with httpx.AsyncClient(
            headers=self._HEADERS, http2=True, timeout=timeout
        ) as client:

            if not stream:
                # ---------- Non-streaming branch ----------
                print("[DeepSeek] Non-streaming request...") # LOGGING
                async with self._sem:
                    t0 = time.perf_counter()
                    try:
                        print("[DeepSeek] Sending POST request...") # LOGGING
                        resp = await client.post(self._ENDPOINT, json=payload)
                        print(f"[DeepSeek] Received response status: {resp.status_code}") # LOGGING
                        resp.raise_for_status() # Check for HTTP errors

                        print("[DeepSeek] Parsing JSON response...") # LOGGING
                        resp_data = resp.json()
                        print(f"[DeepSeek] Received JSON data: {resp_data}") # LOGGING

                        full_text: str = resp_data["choices"][0]["message"]["content"].strip()
                        meta: MetaResponse = {
                            "usage": resp_data.get("usage", {}),
                            "latency": time.perf_counter() - t0,
                            "model": model,
                        }
                        print(f"[DeepSeek] Returning text and meta: {meta}") # LOGGING
                        return full_text, meta
                    except httpx.HTTPStatusError as e:
                        print(f"[DeepSeek] HTTP Error: {e}") # LOGGING
                        print(f"[DeepSeek] Response content: {e.response.text}") # LOGGING
                        raise # Re-raise the exception
                    except Exception as e:
                        print(f"[DeepSeek] Error processing non-streaming response: {e}") # LOGGING
                        raise # Re-raise

            else:
                # ---------- Streaming branch ----------
                print("[DeepSeek] Streaming request...") # LOGGING
                async def generator() -> AsyncIterator[StreamEvent]:
                    print("[DeepSeek] Starting stream generator...") # LOGGING
                    async with self._sem:
                        t0 = time.perf_counter()
                        first_token_t = None
                        usage = None
                        stream_ended = False # Flag to track if stream finished

                        try:
                            print("[DeepSeek] Opening stream connection...") # LOGGING
                            async with client.stream(
                                "POST", self._ENDPOINT, json=payload
                            ) as resp:
                                print(f"[DeepSeek] Stream response status: {resp.status_code}") # LOGGING
                                resp.raise_for_status() # Check for HTTP errors immediately after connection

                                print("[DeepSeek] Iterating stream lines...") # LOGGING
                                async for raw in resp.aiter_lines():
                                    print(f"[DeepSeek] Raw line received: {raw!r}") # LOGGING
                                    if not raw.startswith("data: "):
                                        # Could be heartbeat or empty line
                                        print("[DeepSeek] Skipping non-data line.") # LOGGING
                                        continue
                                    data = raw[6:]
                                    if data == "[DONE]":
                                        print("[DeepSeek] Received [DONE] signal.") # LOGGING
                                        stream_ended = True
                                        break # Exit the loop cleanly

                                    try:
                                        chunk = json.loads(data)
                                        print(f"[DeepSeek] Parsed chunk: {chunk}") # LOGGING

                                        delta = chunk.get("choices", [{}])[0].get("delta", {}).get("content", "")
                                        print(f"[DeepSeek] Extracted delta: {delta!r}") # LOGGING
                                        if delta:
                                            if first_token_t is None:
                                                first_token_t = time.perf_counter()
                                                print("[DeepSeek] First token received.") # LOGGING
                                            yield ChatResponse(type="text", data=delta) # type: ignore

                                        # Capture usage if present
                                        chunk_usage = chunk.get("usage")
                                        if chunk_usage:
                                            usage = chunk_usage
                                            print(f"[DeepSeek] Updated usage: {usage}") # LOGGING

                                    except json.JSONDecodeError:
                                        print(f"[DeepSeek] Warning: Failed to decode JSON from data: {data!r}") # LOGGING
                                    except Exception as e:
                                        print(f"[DeepSeek] Error processing stream chunk: {e}") # LOGGING
                                        # Decide whether to continue or break depending on error

                                print("[DeepSeek] Stream iteration finished.") # LOGGING

                                # Check if stream ended naturally
                                if not stream_ended:
                                     print("[DeepSeek] Warning: Stream finished without [DONE] signal.") # LOGGING

                            # Yield final meta event outside the 'client.stream' context
                            print("[DeepSeek] Preparing final meta event...") # LOGGING
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
                            print(f"[DeepSeek] Yielding meta: {meta_resp}") # LOGGING
                            yield meta_resp

                        except httpx.HTTPStatusError as e:
                             print(f"[DeepSeek] HTTP Error during stream setup: {e}") # LOGGING
                             # Attempt to read response body if possible, might fail
                             try:
                                 body = await e.response.aread()
                                 print(f"[DeepSeek] Error response body: {body.decode()}") # LOGGING
                             except Exception:
                                 print("[DeepSeek] Could not read error response body.") # LOGGING
                             # Yield an error event? Or just raise? For now, raise.
                             raise # Re-raise the exception
                        except Exception as e:
                            print(f"[DeepSeek] Unexpected error in stream generator: {e}") # LOGGING
                            # Consider yielding an error event to the WebSocket before raising
                            raise # Re-raise


                # Return the generator function itself
                return generator()
