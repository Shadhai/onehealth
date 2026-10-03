"""Small concurrent API smoke test for a deployed PostgreSQL-backed service."""
import argparse
import asyncio
import time
import httpx


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("url")
    parser.add_argument("--requests", type=int, default=20)
    args = parser.parse_args()
    started = time.perf_counter()
    async with httpx.AsyncClient(timeout=20) as client:
        responses = await asyncio.gather(
            *(client.get(f"{args.url.rstrip('/')}/health") for _ in range(args.requests))
        )
    elapsed = time.perf_counter() - started
    failures = sum(response.status_code != 200 for response in responses)
    print({"requests": args.requests, "failures": failures, "elapsed_seconds": round(elapsed, 3)})
    raise SystemExit(1 if failures else 0)


asyncio.run(main())
