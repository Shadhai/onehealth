# tests/test_correlate.py
import json
from app.schemas.raw_observation import RawObservation
from app.pipeline.stage2_normalize import normalize_batch, deduplicate
from app.pipeline.stage3_validate import validate_batch
from app.pipeline.stage4_enrich import enrich
from app.pipeline.stage5_correlate import correlate
from app.schemas.enriched_observation import EnrichedObservation, WeatherContext
from datetime import datetime
import pytest


def load_validated():
    with open("data/mock_observations.json") as f:
        raw = [RawObservation(**item) for item in json.load(f)]
    normalized = deduplicate(normalize_batch(raw))
    return validate_batch(normalized)


def make_enriched(obs, rainfall=0.0):
    """Wrap a ValidatedObservation in EnrichedObservation without live API."""
    return EnrichedObservation(
        observation=obs,
        weather=WeatherContext(rainfall_48h_mm=rainfall, mean_air_temp_c=15.0),
        enriched_at=datetime.utcnow(),
    )


@pytest.fixture(scope="module")
def validated():
    return load_validated()


def get(validated, submission_id):
    return next(v for v in validated if v.submission_id == submission_id)


def test_healthy_site_produces_low_risk(validated):
    """0001 is a clean 'Good' record — should produce Low risk."""
    obs = get(validated, "OAH-2026-0001")
    insight = correlate(make_enriched(obs))
    assert insight.risk_level == "Low"
    assert insight.risk_index < 0.25
    assert insight.risk_colour == "green"


def test_severe_degradation_produces_high_risk(validated):
    """0007 is a 'Poor' record with dead fish, no vegetation — High risk."""
    obs = get(validated, "OAH-2026-0007")
    insight = correlate(make_enriched(obs, rainfall=0.0))
    assert insight.risk_level == "High"
    assert insight.risk_index >= 0.55
    assert insight.risk_colour == "red"


def test_causal_chain_present_for_severe_site(validated):
    """0007 should have at least one causal link."""
    obs = get(validated, "OAH-2026-0007")
    insight = correlate(make_enriched(obs))
    assert len(insight.causal_chain) >= 1


def test_human_risk_high_for_coliforms(validated):
    """0007 has coliforms 'high' — human exposure should be elevated."""
    obs = get(validated, "OAH-2026-0007")
    insight = correlate(make_enriched(obs))
    assert insight.human.score > 0.3
    assert insight.human.risk_level in ("Moderate", "High")


def test_rainfall_increases_environmental_pressure(validated):
    """Same observation with heavy rain should score higher."""
    obs = get(validated, "OAH-2026-0002")
    dry = correlate(make_enriched(obs, rainfall=0.0))
    wet = correlate(make_enriched(obs, rainfall=25.0))
    # Environmental pressure contributes to overall risk index
    assert wet.risk_index >= dry.risk_index


def test_confidence_reflects_completeness(validated):
    """0001 has full data — High confidence. 0013 is partial — lower."""
    full = correlate(make_enriched(get(validated, "OAH-2026-0001")))
    partial = correlate(make_enriched(get(validated, "OAH-2026-0013")))
    assert full.confidence == "High"
    assert partial.confidence in ("Low", "Medium")


def test_all_insights_have_three_domains(validated):
    """Every insight must have human, animal, and ecosystem columns."""
    for v in validated:
        insight = correlate(make_enriched(v))
        assert insight.human.domain == "human"
        assert insight.animal.domain == "animal"
        assert insight.ecosystem.domain == "ecosystem"