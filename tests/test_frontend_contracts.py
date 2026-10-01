"""Verify the API contracts consumed by the frontend."""
import asyncio
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
    with open("data/mock_observations.json") as file:
        raw = [RawObservation(**item) for item in json.load(file)]

    loop = asyncio.new_event_loop()
    try:
        loop.run_until_complete(run_pipeline(raw, store, enrich_weather=False))
    finally:
        loop.close()

    return TestClient(create_app(store=store))


def test_insights_list_shape(client):
    response = client.get("/insights")
    assert response.status_code == 200
    card = response.json()[0]
    for key in ("observation_id", "site", "risk", "confidence", "columns",
                "causal_chain", "generated_at"):
        assert key in card
    assert {"level", "colour", "hex", "index"} <= card["risk"].keys()


def test_insight_by_id_has_three_columns(client):
    first = client.get("/insights").json()[0]
    response = client.get(f"/insights/{first['observation_id']}")
    assert response.status_code == 200
    card = response.json()
    assert len(card["columns"]) == 3
    assert {column["domain"] for column in card["columns"]} == {
        "human", "animal", "ecosystem"
    }
    for column in card["columns"]:
        assert {"domain", "title", "icon", "level", "score", "summary",
                "reasons", "actions"} <= column.keys()


def test_insight_404(client):
    assert client.get("/insights/this-id-does-not-exist").status_code == 404


def test_trends_returns_chronological_series(client):
    site = client.get("/insights").json()[0]["site"]
    response = client.get(f"/insights/trends/{site}")
    assert response.status_code == 200
    series = response.json()
    assert [point["generated_at"] for point in series] == sorted(
        point["generated_at"] for point in series
    )
    for point in series:
        assert {"observation_id", "risk_index", "risk_level", "generated_at",
                "human_score", "animal_score", "ecosystem_score", "confidence"} <= point.keys()


def test_trends_empty_for_unknown_site(client):
    response = client.get("/insights/trends/Nonexistent%20Segment")
    assert response.status_code == 200
    assert response.json() == []


def test_flags_for_clean_record(client):
    cards = client.get("/insights").json()
    card = next(item for item in cards if item["site"] == "Riverdale Creek - Segment 1")
    response = client.get(f"/insights/{card['observation_id']}/flags")
    assert response.status_code == 200
    data = response.json()
    assert data["flag_count"] == 0
    assert data["validation_status"] == "valid"
    assert data["flags"] == []


def test_flags_for_contradictory_record(client):
    cards = client.get("/insights").json()
    card = next(item for item in cards if item["site"] == "Riverdale Creek - Segment 6")
    response = client.get(f"/insights/{card['observation_id']}/flags")
    assert response.status_code == 200
    data = response.json()
    assert data["flag_count"] >= 3
    assert data["validation_status"] == "needs_review"
    assert {flag["rule_id"] for flag in data["flags"]} >= {"R008", "R009", "R010"}


def test_flags_404_for_unknown_id(client):
    assert client.get("/insights/does-not-exist/flags").status_code == 404


def test_fhir_endpoint_returns_valid_bundle(client):
    observation_id = client.get("/insights").json()[0]["observation_id"]
    response = client.get(f"/fhir/{observation_id}")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/fhir+json")
    bundle = response.json()
    assert bundle["resourceType"] == "Bundle"
    assert bundle["type"] == "collection"
    assert isinstance(bundle["entry"], list)
    assert len(bundle["entry"]) >= 5