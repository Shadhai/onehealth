# tests/test_api.py
import asyncio
import json
import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.db import Store
from app.schemas.raw_observation import RawObservation
from app.pipeline.orchestrator import run_pipeline


@pytest.fixture
def client():
    store = Store(":memory:")
    with open("data/mock_observations.json") as f:
        raw = [RawObservation(**item) for item in json.load(f)]

    loop = asyncio.new_event_loop()
    try:
        loop.run_until_complete(run_pipeline(raw, store, enrich_weather=False))
    finally:
        loop.close()

    app = create_app(store=store)
    # Disable static mount during tests (no static/ dir yet)
    return TestClient(app)


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_list_insights(client):
    r = client.get("/insights")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 15


def test_get_insight_by_id(client):
    r = client.get("/insights")
    first = r.json()[0]
    obs_id = first["observation_id"]

    r = client.get(f"/insights/{obs_id}")
    assert r.status_code == 200
    card = r.json()
    assert "columns" in card
    assert len(card["columns"]) == 3
    assert card["columns"][0]["domain"] == "human"
    assert card["columns"][1]["domain"] == "animal"
    assert card["columns"][2]["domain"] == "ecosystem"


def test_get_insight_not_found(client):
    r = client.get("/insights/nonexistent-id")
    assert r.status_code == 404


def test_insights_by_site(client):
    r = client.get("/insights/site/Riverdale Creek - Segment 4")
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 1
    for item in data:
        assert item["site"] == "Riverdale Creek - Segment 4"


def test_fhir_endpoint_returns_bundle(client):
    r = client.get("/insights")
    first = r.json()[0]
    obs_id = first["observation_id"]

    r = client.get(f"/fhir/{obs_id}")
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("application/fhir+json")

    bundle = json.loads(r.text)
    assert bundle["resourceType"] == "Bundle"
    assert bundle["type"] == "collection"
    assert len(bundle["entry"]) >= 5


def test_fhir_not_found(client):
    r = client.get("/fhir/nonexistent-id")
    assert r.status_code == 404


def test_ingest_mock_reruns_pipeline(client):
    r = client.post("/ingest/mock")
    assert r.status_code == 200
    body = r.json()
    assert body["ingested"] == 15
    assert body["insights"] == 15
    # Running twice should not duplicate (INSERT OR REPLACE)
    r2 = client.post("/ingest/mock")
    assert r2.status_code == 200
    assert r2.json()["insight_count"] == 15