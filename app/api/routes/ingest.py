# app/api/routes/ingest.py
"""
Ingestion endpoints. Demo mode: rerun pipeline on bundled mock data.
"""
import json
from collections import defaultdict
from time import monotonic
from typing import List
from fastapi import APIRouter, Header, HTTPException, Request

from app.schemas.raw_observation import RawObservation
from app.pipeline.orchestrator import run_pipeline
from app.config import ingestion_api_key

router = APIRouter()
_live_requests: dict[str, list[float]] = defaultdict(list)


@router.post("/observations")
async def ingest_observations(observations: List[RawObservation], request: Request):
    """Process field observations submitted by the online or offline queue."""
    if not observations:
        raise HTTPException(status_code=400, detail="At least one observation is required")

    ids = [item.submission_id for item in observations]
    conflicts = sorted({item for item in ids if ids.count(item) > 1 and item})
    insights = await run_pipeline(
        observations,
        request.app.state.store,
        enrich_weather=False,
    )
    return {
        "ingested": len(observations),
        "insights": len(insights),
        "observation_ids": [insight.observation_id for insight in insights],
        "conflicts": conflicts,
    }


@router.post("/live")
async def ingest_live(
    observations: List[RawObservation],
    request: Request,
    x_api_key: str | None = Header(default=None),
):
    """Authenticated live-ingestion endpoint for OAH or trusted field clients."""
    expected = ingestion_api_key()
    if not expected:
        raise HTTPException(status_code=503, detail="Live ingestion is not configured")
    if x_api_key != expected:
        raise HTTPException(status_code=401, detail="Invalid ingestion credentials")
    now = monotonic()
    recent = [stamp for stamp in _live_requests[x_api_key] if now - stamp < 60]
    if len(recent) >= 60:
        raise HTTPException(status_code=429, detail="Ingestion rate limit exceeded")
    _live_requests[x_api_key] = recent + [now]
    return await ingest_observations(observations, request)


@router.post("/mock")
async def ingest_mock(request: Request):
    """Run the full pipeline on data/mock_observations.json."""
    store = request.app.state.store
    try:
        with open("data/mock_observations.json") as f:
            raw = [RawObservation(**item) for item in json.load(f)]
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Mock data file not found")

    insights = await run_pipeline(raw, store, enrich_weather=False)
    return {
        "ingested": len(raw),
        "insights": len(insights),
        "raw_count": store.count("raw_observations"),
        "insight_count": store.count("one_health_insights"),
    }