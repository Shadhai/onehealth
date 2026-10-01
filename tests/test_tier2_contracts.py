"""Contracts for Tier 2 aggregate endpoints."""
import asyncio
import csv
import io
import json

import pytest
from fastapi.testclient import TestClient

from app.db import Store
from app.main import create_app
from app.pipeline.orchestrator import run_pipeline
from app.schemas.raw_observation import RawObservation


@pytest.fixture
def client():
    store = Store(":memory:")
    with open("data/mock_observations.json") as handle:
        raw = [RawObservation(**item) for item in json.load(handle)]
    loop = asyncio.new_event_loop()
    try:
        loop.run_until_complete(run_pipeline(raw, store, enrich_weather=False))
    finally:
        loop.close()
    return TestClient(create_app(store=store))


def test_sites_returns_aggregates_and_coordinates(client):
    response = client.get("/api/sites")
    assert response.status_code == 200
    sites = response.json()
    assert len(sites) >= 7
    assert len({site["site"] for site in sites}) == len(sites)
    for site in sites:
        assert site["observation_count"] >= 1
        assert site["latest_risk_level"] in ("Low", "Moderate", "High")
        assert site["latitude"] is not None
        assert site["longitude"] is not None


def test_sites_counts_flagged_observations(client):
    sites = client.get("/api/sites").json()
    segment = next(site for site in sites if "Segment 6" in site["site"])
    assert segment["flagged_observation_count"] >= 1


def test_export_csv_all_and_by_site(client):
    response = client.get("/api/export/csv")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert "attachment" in response.headers["content-disposition"]
    rows = list(csv.DictReader(io.StringIO(response.text)))
    assert len(rows) >= 15
    filtered = client.get("/api/export/csv", params={"site": rows[0]["site"]})
    filtered_rows = list(csv.DictReader(io.StringIO(filtered.text)))
    assert filtered_rows
    assert {row["site"] for row in filtered_rows} == {rows[0]["site"]}
    assert "causal_link_count" in rows[0]
