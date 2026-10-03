import httpx
import json
import logging
import os
import pandas as pd
from typing import List, Optional
from app.schemas.raw_observation import RawObservation

OAH_API_BASE = "https://api.enora-oah.eu"  # verified from network capture
logger = logging.getLogger(__name__)


async def ingest_from_oah_app(token: str, api_url: Optional[str] = None) -> List[RawObservation]:
    """
    Pull submissions from the OAH Citizen Science App.
    The exact JSON shape is not yet publicly documented, so we use a tolerant parser.
    """
    url = (api_url or os.getenv("OAH_API_URL") or OAH_API_BASE).rstrip("/")
    if not url.endswith("/submissions"):
        url = f"{url}/submissions"

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            url,
            headers={"Authorization": f"Bearer {token}"} if token else {},
            timeout=3.0,
        )
        resp.raise_for_status()
        data = resp.json()
        if isinstance(data, dict) and "data" in data:
            data = data["data"]
        return [RawObservation(**item) for item in data]


def ingest_from_csv(filepath: str) -> List[RawObservation]:
    """Fallback: parse a CSV export of submissions."""
    df = pd.read_csv(filepath)
    df = df.where(pd.notnull(df), None)
    return [RawObservation(**row) for row in df.to_dict(orient="records")]


def ingest_mock_data(filepath: str = "data/mock_observations.json") -> List[RawObservation]:
    """Development fallback: load bundled realistic mock data."""
    with open(filepath, encoding="utf-8") as f:
        data = json.load(f)
    return [RawObservation(**item) for item in data]


async def ingest(
    source: str = "mock",
    token: Optional[str] = None,
    csv_path: Optional[str] = None,
) -> List[RawObservation]:
    if source == "csv" and csv_path:
        return ingest_from_csv(csv_path)

    if source == "oah_app" and token:
        try:
            return await ingest_from_oah_app(token)
        except (httpx.HTTPError, OSError, ValueError, TypeError) as exc:
            logger.warning("Live OAH ingestion failed; using mock observations: %s", exc)
            return ingest_mock_data()

    api_url = os.getenv("OAH_API_URL")
    if api_url:
        try:
            return await ingest_from_oah_app(token or "", api_url=api_url)
        except (httpx.HTTPError, OSError, ValueError, TypeError) as exc:
            logger.warning("OAH_API_URL ingestion failed; using mock observations: %s", exc)

    return ingest_mock_data()
