"""
async_test.py  minimal concurrency smoke test for DeepSeek
-----------------------------------------------------------
Hardcodes N simultaneous calls.  Each call asks:
    "What is n + n?"               (where n is the request index)

Requirements:
  pip install httpx python-dotenv rich
  (.env one directory up containing  DEEPSEEK_API_KEY=your_key_here)

Run:
  python async_test.py
"""

import asyncio, os, sys, time
from datetime import datetime
from pathlib import Path
import json, itertools


import httpx
from dotenv import load_dotenv
from rich.pretty import pprint
from rich.table import Table
from rich.console import Console

# ---------- configuration ----------
N               = 10                          # number of parallel requests
MODEL           = "deepseek-chat"            # or any DeepSeek model you use
ENDPOINT        = "https://api.deepseek.com/chat/completions"
TIMEOUT_SECONDS = 60
# ------------------------------------

# find .env in a parent directory, then load it
load_dotenv()
API_KEY = os.getenv("DEEPSEEK_API_KEY")
if not API_KEY:
    sys.exit("DEEPSEEK_API_KEY not found – create a .env above this script.")

HEADERS = {"Authorization": f"Bearer {API_KEY}"}

console = Console()
results = []          # will hold (n, started, ended, latency, answer_text)

async def call_llm(client: httpx.AsyncClient, n: int, *, stream: bool = True):
    started = time.perf_counter()
    payload = {
        "model": MODEL,
        "messages": [{"role": "user", "content": f"What is {n} + {n}?"}],
        "temperature": 0.0,
        "stream": stream,
    }

    if not stream:
        r = await client.post(ENDPOINT, json=payload)
        r.raise_for_status()
        content = r.json()["choices"][0]["message"]["content"].strip()
        ended = time.perf_counter()
        results.append((n, started, ended, ended - started, content))
        return

    # ---------- streaming path ----------
    answer_tokens = []
    first_token_t = None

    async with client.stream("POST", ENDPOINT, json=payload) as r:
        async for raw in r.aiter_lines():
            if not raw.startswith("data: "):
                continue                # ignore keep‑alive comments
            data = raw[6:]
            if data == "[DONE]":
                break
            chunk = json.loads(data)
            delta = chunk["choices"][0]["delta"].get("content", "")
            if delta:
                if first_token_t is None:
                    first_token_t = time.perf_counter()
                answer_tokens.append(delta)

    ended = time.perf_counter()
    latency = ended - started
    ttfb   = (first_token_t - started) if first_token_t else None
    content = "".join(answer_tokens).strip()
    results.append((n, started, ended, latency, content, ttfb))

async def main():
    t0 = datetime.now()
    console.print(f"[bold]Kick‑off[/bold] at {t0:%H:%M:%S.%f}")

    async with httpx.AsyncClient(
        headers=HEADERS, http2=True, timeout=TIMEOUT_SECONDS
    ) as client:
        tasks = []
        for i in range(1, N + 1):
            tasks.append(asyncio.create_task(call_llm(client, i, stream=True)))
            await asyncio.sleep(0.25)
        await asyncio.gather(*tasks)
    
    t1 = datetime.now()
    wall = (t1 - t0).total_seconds()
    
    # pretty‑print individual latencies
    table = Table(title=f"DeepSeek non‑stream concurrency test  –  N = {N}")
    table.add_column("#", justify="right")
    table.add_column("Started (s)", justify="right")
    table.add_column("TTFB (s)", justify="right")
    table.add_column("Ended (s)", justify="right")
    table.add_column("Latency (s)", justify="right")
    table.add_column("LLM answer")
    
    # sort by request index to keep lines stable
    for row in sorted(results, key=lambda r: r[0]):
        n, s, e, lat, txt, *maybe_ttfb = row
        ttfb = f"{maybe_ttfb[0]:.3f}" if maybe_ttfb else "-"
        table.add_row(str(n), f"{s:.3f}", ttfb, f"{e:.3f}", f"{lat:.3f}", txt[:40])
    
    console.print(table)
    console.print(f"[green]Total wall‑clock time[/green]: {wall:.3f} s")

if __name__ == "__main__":
    # On Windows ensure event loop policy that plays nicely with httpx
    if sys.platform.startswith("win"):
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
