# backend/tests/test_deepseek.py
#
# Live DeepSeek integration test.
#
# Run:     pytest -q
# Requires:
#   pip install pytest pytest-asyncio httpx python-dotenv
#
# Skips automatically when DEEPSEEK_API_KEY is not set.

import asyncio, os, pytest, time, json

from backend.services.ai.deepseek import DeepSeek
from backend.services.ai.base import ChatResponse, MetaResponse

DS = DeepSeek()


# ----------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------

TEST_MESSAGES = [{"role": "user", "content": "What is 1 + 1?"}]


def has_api_key() -> bool:
    return bool(os.getenv("DEEPSEEK_API_KEY"))


# ----------------------------------------------------------------------
# Actual API smoke tests
# ----------------------------------------------------------------------

@pytest.mark.skipif(not has_api_key(), reason="DEEPSEEK_API_KEY not configured")
@pytest.mark.asyncio
async def test_non_stream_live():
    """Non‑stream call returns full text and a meta dict."""
    text, meta = await DS.chat(TEST_MESSAGES, stream=False)

    assert text.strip().startswith("2")              # answer is correct
    assert meta["latency"] < 30                      # should finish quickly
    assert "usage" in meta and meta["usage"]["total_tokens"] > 0
    assert meta["model"].startswith("deepseek")


@pytest.mark.skipif(not has_api_key(), reason="DEEPSEEK_API_KEY not configured")
@pytest.mark.asyncio
async def test_stream_live():
    """Stream call yields token events and one meta event."""
    tokens = []
    meta_obj: MetaResponse | None = None
    t0 = time.perf_counter()

    async for ev in await DS.chat(TEST_MESSAGES, stream=True):
        if ev["type"] == "text":
            tokens.append(ev["data"])
        else:
            meta_obj = ev["data"]

    t1 = time.perf_counter()

    # basic sanity checks
    assert "".join(tokens).strip().startswith("2")
    assert meta_obj is not None
    assert meta_obj["ttfb"] < meta_obj["latency"] < 30
    # total wall clock should roughly equal the reported latency
    assert abs(meta_obj["latency"] - (t1 - t0)) < 5
