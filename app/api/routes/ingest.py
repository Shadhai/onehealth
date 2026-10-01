# app/api/routes/ingest.py
"""
Ingestion endpoints. Demo mode: rerun pipeline on bundled mock data.
"""
import json
from fastapi import APIRouter, HTTPException, Request

from app.schemas.raw_observation import RawObservation
from app.pipeline.orchestrator import run_pipeline

router = APIRouter()


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