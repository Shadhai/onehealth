# tests/test_fhir.py
import json
from datetime import datetime
from app.schemas.raw_observation import RawObservation
from app.pipeline.stage2_normalize import normalize_batch, deduplicate
from app.pipeline.stage3_validate import validate_batch
from app.pipeline.stage4_enrich import enrich
from app.pipeline.stage5_correlate import correlate
from app.pipeline.stage6_fhir import to_fhir_bundle
from app.schemas.enriched_observation import EnrichedObservation, WeatherContext


def load_validated():
    with open("data/mock_observations.json") as f:
        raw = [RawObservation(**item) for item in json.load(f)]
    return validate_batch(deduplicate(normalize_batch(raw)))


def make_enriched(v):
    return EnrichedObservation(
        observation=v,
        weather=WeatherContext(rainfall_48h_mm=0.0, mean_air_temp_c=15.0),
        enriched_at=datetime.utcnow(),
    )


def test_bundle_contains_location():
    validated = load_validated()
    v = next(x for x in validated if x.submission_id == "OAH-2026-0001")
    insight = correlate(make_enriched(v))
    bundle = to_fhir_bundle(make_enriched(v), insight)

    resource_types = [e.resource.get_resource_type() for e in bundle.entry]
    assert "Location" in resource_types


def test_bundle_contains_observations():
    validated = load_validated()
    v = next(x for x in validated if x.submission_id == "OAH-2026-0001")
    insight = correlate(make_enriched(v))
    bundle = to_fhir_bundle(make_enriched(v), insight)

    resource_types = [e.resource.get_resource_type() for e in bundle.entry]
    assert resource_types.count("Observation") >= 5

def test_bundle_contains_health_measure():
    validated = load_validated()
    v = next(x for x in validated if x.submission_id == "OAH-2026-0001")
    insight = correlate(make_enriched(v))
    bundle = to_fhir_bundle(make_enriched(v), insight)

    health_measures = [
        e for e in bundle.entry
        if e.resource.get_resource_type() == "Observation"
        and any(
            "observation-health-measure-oah" in p
            for p in (e.resource.meta.profile or [])
        )
    ]
    assert len(health_measures) == 1


def test_bundle_serializes_to_json():
    validated = load_validated()
    v = next(x for x in validated if x.submission_id == "OAH-2026-0001")
    insight = correlate(make_enriched(v))
    bundle = to_fhir_bundle(make_enriched(v), insight)

    from app.pipeline.stage6_fhir import serialize_bundle
    j = serialize_bundle(bundle)
    assert len(j) > 100
    parsed = json.loads(j)
    assert parsed["resourceType"] == "Bundle"
    assert parsed["type"] == "collection"


def test_observations_have_profile():
    """Every Observation must declare its OAH profile."""
    validated = load_validated()
    v = next(x for x in validated if x.submission_id == "OAH-2026-0001")
    insight = correlate(make_enriched(v))
    bundle = to_fhir_bundle(make_enriched(v), insight)

    for entry in bundle.entry:
        if entry.resource.get_resource_type() == "Observation":
            assert entry.resource.meta is not None
            assert entry.resource.meta.profile
            assert any("oah" in p for p in entry.resource.meta.profile)