import json
from pathlib import Path

import pytest

from app.db_sqlalchemy import SQLAlchemyStore
from app.pipeline.orchestrator import run_pipeline
from app.schemas.raw_observation import RawObservation


@pytest.fixture
def store():
    adapter = SQLAlchemyStore("sqlite:///:memory:")
    yield adapter
    adapter.close()


def load_raw():
    path = Path("data/mock_observations.json")
    return [RawObservation(**item) for item in json.loads(path.read_text())]


@pytest.mark.asyncio
async def test_sqlalchemy_store_matches_pipeline_contract(store):
    raw = load_raw()
    insights = await run_pipeline(raw, store, enrich_weather=False)

    assert len(insights) == len(raw)
    store.flush()
    normalized_count = store.count("normalized_observations")
    assert normalized_count > 0
    assert store.count("raw_observations") == len(raw)
    assert store.count("one_health_insights") == normalized_count
    assert store.count("fhir_bundles") == normalized_count

    first = insights[0]
    loaded = store.get_insight(first.observation_id)
    assert loaded["observation_id"] == first.observation_id
    assert store.get_fhir_bundle(first.observation_id)
    assert store.get_validated(first.observation_id)
    assert store.get_recent_insights(limit=2)
    assert store.get_insights_by_site(first.research_site)
    assert store.get_trends_by_site(first.research_site)
    assert any(item["site"] == first.research_site for item in store.get_all_sites_summary())


@pytest.mark.asyncio
async def test_sqlalchemy_store_upserts_existing_keys(store):
    raw = load_raw()
    insights = await run_pipeline(raw[:1], store, enrich_weather=False)
    store.flush()
    first = insights[0]
    original_count = store.count("one_health_insights")

    store.save_insight(first)
    store.flush()

    assert store.count("one_health_insights") == original_count
    assert store.get_insight(first.observation_id)["observation_id"] == first.observation_id
