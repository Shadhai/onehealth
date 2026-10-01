# app/pipeline/stage1_ingest.py
import httpx
import json
import pandas as pd
from datetime import datetime
from typing import List, Optional
from app.schemas.raw_observation import RawObservation

OAH_API_BASE = "https://api.enora-oah.eu"  # verified from network capture

async def ingest_from_oah_app(token: str) -> List[RawObservation]:
    """
    Pull submissions from the OAH Citizen Science App.
    The exact JSON shape is not yet publicly documented, so we use a tolerant parser.
    """
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{OAH_API_BASE}/submissions",
            headers={"Authorization": f"Bearer {token}"},
            timeout=30.0,
        )
        resp.raise_for_status()
        data = resp.json()
        # The API may return a list or a dict with a 'data' key.
        if isinstance(data, dict) and "data" in data:
            data = data["data"]
        return [RawObservation(**item) for item in data]

def ingest_from_csv(filepath: str) -> List[RawObservation]:
    """Fallback: parse a CSV export of submissions."""
    df = pd.read_csv(filepath)
    # Convert NaN to None for Pydantic
    df = df.where(pd.notnull(df), None)
    return [RawObservation(**row) for row in df.to_dict(orient="records")]

def ingest_mock_data(filepath: str = "data/mock_observations.json") -> List[RawObservation]:
    """Development fallback: load bundled realistic mock data."""
    with open(filepath) as f:
        data = json.load(f)
    return [RawObservation(**item) for item in data]

async def ingest(source: str = "mock", token: Optional[str] = None, csv_path: Optional[str] = None) -> List[RawObservation]:
    if source == "oah_app" and token:
        return await ingest_from_oah_app(token)
    elif source == "csv" and csv_path:
        return ingest_from_csv(csv_path)
    else:
        return ingest_mock_data()