# tests/test_store.py
import json
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
import pytest

from app.db import Store
from app.schemas.raw_observation import RawObservation
from app.pipeline.stage2_normalize import normalize_batch, deduplicate
from app.pipeline.stage3_validate import validate_batch
from app.pipeline.stage5_correlate import correlate
from app.pipeline.orchestrator import run_pipeline
from app.schemas.enriched_observation import EnrichedObservation, WeatherContext


def load_raw():
    with open("data/mock_observations.json") as f:
        return [RawObservation(**item) for item in json.load(f)]


def make_enriched(v):
    return EnrichedObservation(
        observation=v,
        weather=WeatherContext(rainfall_48h_mm=0.0, mean_air_temp_c=15.0),
        enriched_at=datetime.utcnow(),
    )


@pytest.fixture
def store():
    s = Store(":memory:")
    yield s
    s.close()


def test_store_creates_all_tables(store):
    for table in ("raw_observations", "normalized_observations",
                  "validated_observations", "enriched_observations",
                  "one_health_insights", "fhir_bundles"):
        assert store.count(table) == 0


def test_save_and_get_insight_round_trip(store):
    raw = load_raw()
    validated = validate_batch(deduplicate(normalize_batch(raw)))
    v = next(x for x in validated if x.submission_id == "OAH-2026-0001")
    insight = correlate(make_enriched(v))

    store.save_insight(insight)
    loaded = store.get_insight(insight.observation_id)

    assert loaded is not None
    assert loaded["observation_id"] == insight.observation_id
    assert loaded["risk_index"] == insight.risk_index
    assert loaded["risk_level"] == insight.risk_level
    assert loaded["human"]["domain"] == "human"


def test_get_insights_by_site_filters_correctly(store):
    raw = load_raw()
    normalized = deduplicate(normalize_batch(raw))
    validated = validate_batch(normalized)
    for n in normalized:
        store.save_normalized(n)
    for v in validated:
        store.save_insight(correlate(make_enriched(v)))

    seg4 = store.get_insights_by_site("Riverdale Creek - Segment 4")
    seg5 = store.get_insights_by_site("Riverdale Creek - Segment 5")

    assert len(seg4) >= 1
    assert len(seg5) >= 1
    for item in seg4:
        assert item["research_site"] == "Riverdale Creek - Segment 4"


def test_get_insights_by_site_orders_by_submission_desc(store):
    raw = load_raw()
    normalized = deduplicate(normalize_batch(raw))
    validated = validate_batch(normalized)
    for n in normalized:
        store.save_normalized(n)
    for v in validated:
        store.save_insight(correlate(make_enriched(v)))

    results = store.get_insights_by_site("Riverdale Creek - Segment 4")
    submission_by_observation = {
        n.observation_id: n.submission_id for n in normalized
    }
    submissions = [submission_by_observation[r["observation_id"]] for r in results]
    assert submissions == sorted(submissions, reverse=True)


def test_fhir_bundle_round_trip(store):
    raw = load_raw()
    validated = validate_batch(deduplicate(normalize_batch(raw)))
    v = next(x for x in validated if x.submission_id == "OAH-2026-0001")
    insight = correlate(make_enriched(v))

    dummy_bundle = json.dumps({"resourceType": "Bundle", "type": "collection"})
    store.save_fhir_bundle(insight.observation_id, dummy_bundle)

    loaded = store.get_fhir_bundle(insight.observation_id)
    assert loaded is not None
    parsed = json.loads(loaded)
    assert parsed["resourceType"] == "Bundle"


def test_count_rejects_unknown_table(store):
    with pytest.raises(ValueError):
        store.count("malicious_table; DROP TABLE users;")


@pytest.mark.asyncio
async def test_full_pipeline_persists_everything(store):
    raw = load_raw()
    insights = await run_pipeline(raw, store, enrich_weather=False)

    assert len(insights) == len(raw)

    # Raw count equals input
    assert store.count("raw_observations") == len(raw)

    # Normalized count is less than or equal to raw (deduplication may drop)
    assert store.count("normalized_observations") <= len(raw)
    assert store.count("normalized_observations") > 0

    # Validated, enriched, insights, bundles all match normalized count
    n = store.count("normalized_observations")
    assert store.count("validated_observations") == n
    assert store.count("enriched_observations") == n
    assert store.count("one_health_insights") == n
    assert store.count("fhir_bundles") == n


@pytest.mark.asyncio
async def test_get_all_sites_summary_is_safe_with_concurrent_reads(store):
    raw = load_raw()
    await run_pipeline(raw, store, enrich_weather=False)

    def read_summary():
        sites = store.get_all_sites_summary()
        assert len(sites) >= 1
        assert all("site" in site for site in sites)

    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = [pool.submit(read_summary) for _ in range(20)]
        for future in futures:
            future.result()