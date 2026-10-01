# tests/test_normalize.py
"""
Tests for Stage 2 normalization.
Verifies: unit conversion, deduplication, completeness scoring, deterministic IDs.
"""
import json
import pytest
from datetime import datetime
from app.schemas.raw_observation import RawObservation
from app.pipeline.stage2_normalize import normalize, normalize_batch, deduplicate

# Load the mock dataset once
with open("data/mock_observations.json") as f:
    MOCK_DATA = json.load(f)

RAW = [RawObservation(**item) for item in MOCK_DATA]


# ---------- Unit conversion tests (submission OAH-2026-0010) ----------

def test_fahrenheit_to_celsius():
    """0010 reports water_temperature = 57.2 F, should become 14.0 C."""
    obs = next(r for r in RAW if r.submission_id == "OAH-2026-0010")
    normalized = normalize(obs)
    # (57.2 - 32) * 5/9 = 14.0
    assert normalized.water_temperature_c == 14.0


def test_percent_saturation_to_mg_l():
    """0010 reports dissolved_oxygen = 88.0 (% sat), should become ~7.79 mg/L."""
    obs = next(r for r in RAW if r.submission_id == "OAH-2026-0010")
    normalized = normalize(obs)
    # 88.0 / 11.3 = 7.79 (approx, at 20 C)
    assert normalized.dissolved_oxygen_mg_l == 7.79


def test_g_per_l_to_mg_l():
    """0010 reports tds = 0.27 (g/L), should become 270 mg/L."""
    obs = next(r for r in RAW if r.submission_id == "OAH-2026-0010")
    normalized = normalize(obs)
    assert normalized.tds_mg_l == 270.0


def test_ms_cm_to_us_cm():
    """0010 reports conductivity = 0.38 (mS/cm), should become 380 uS/cm."""
    obs = next(r for r in RAW if r.submission_id == "OAH-2026-0010")
    normalized = normalize(obs)
    assert normalized.conductivity_us_cm == 380.0


def test_celsius_left_unchanged():
    """0001 reports 14.5 C, should stay 14.5."""
    obs = next(r for r in RAW if r.submission_id == "OAH-2026-0001")
    normalized = normalize(obs)
    assert normalized.water_temperature_c == 14.5


# ---------- Completeness scoring ----------

def test_completeness_full_record():
    """0001 has all 10 key fields populated."""
    obs = next(r for r in RAW if r.submission_id == "OAH-2026-0001")
    normalized = normalize(obs)
    assert normalized.completeness_score == 1.0


def test_completeness_partial_record():
    """0013 is missing most key fields (ph, overall_rating, water_appearance present)."""
    obs = next(r for r in RAW if r.submission_id == "OAH-2026-0013")
    normalized = normalize(obs)
    # Key fields present: ph, overall_rating, water_appearance_code = 3 of 10
    assert normalized.completeness_score == 0.3


# ---------- Deterministic IDs ----------

def test_deterministic_id():
    """Same input always produces the same observation_id."""
    obs = next(r for r in RAW if r.submission_id == "OAH-2026-0001")
    n1 = normalize(obs)
    n2 = normalize(obs)
    assert n1.observation_id == n2.observation_id


def test_different_ids_for_different_submissions():
    obs1 = next(r for r in RAW if r.submission_id == "OAH-2026-0001")
    obs2 = next(r for r in RAW if r.submission_id == "OAH-2026-0002")
    assert normalize(obs1).observation_id != normalize(obs2).observation_id


# ---------- Deduplication ----------

def test_deduplicate_removes_near_duplicate():
    """
    0011 and 0012 are from different users but same site and close in time.
    Our dedup key is (user_id, research_site), so they should NOT be merged
    because user_ids differ. This test confirms the current behavior.
    """
    normalized = normalize_batch(RAW)
    ids = [n.submission_id for n in normalized]
    assert "OAH-2026-0011" in ids
    assert "OAH-2026-0012" in ids


def test_deduplicate_same_user_same_site_within_60s():
    """Synthetic duplicate: same user, same site, 1 second apart."""
    base = RawObservation(
        submission_id="DUP-1",
        user_id="user-dup",
        research_site="Test Site",
        submitted_at=datetime.fromisoformat("2026-09-01T10:00:00"),
        ph=7.0,
        source="mock",
    )
    dup = base.copy(update={
        "submission_id": "DUP-2",
        "submitted_at": datetime.fromisoformat("2026-09-01T10:00:01"),
    })
    result = deduplicate([normalize(base), normalize(dup)])
    assert len(result) == 1


# ---------- Missing field handling ----------

def test_missing_fields_are_none():
    """0013 has no dissolved_oxygen, should be None (not 0)."""
    obs = next(r for r in RAW if r.submission_id == "OAH-2026-0013")
    normalized = normalize(obs)
    assert normalized.dissolved_oxygen_mg_l is None
    assert normalized.water_temperature_c is None


# ---------- Code pass-through ----------

def test_verified_codes_preserved():
    """NAT, FAS, CL codes must pass through unchanged."""
    obs_nat = next(r for r in RAW if r.submission_id == "OAH-2026-0001")
    obs_fas = next(r for r in RAW if r.submission_id == "OAH-2026-0003")
    obs_cl  = next(r for r in RAW if r.submission_id == "OAH-2026-0007")
    assert normalize(obs_nat).channel_form_code == "NAT"
    assert normalize(obs_fas).channel_form_code == "FAS"
    assert normalize(obs_cl).channel_form_code == "CL"


def test_rating_values_preserved():
    """Good / Moderate / Poor ratings must pass through unchanged."""
    obs = next(r for r in RAW if r.submission_id == "OAH-2026-0002")
    normalized = normalize(obs)
    assert normalized.overall_rating == "Moderate"
    assert normalized.degradation_score == 2


def test_macrophyte_codes_preserved():
    """Macrophyte code lists must survive normalization."""
    obs = next(r for r in RAW if r.submission_id == "OAH-2026-0009")
    normalized = normalize(obs)
    assert normalized.macrophytes_codes == [
        "broad-leaved-herbs", "floating-leaved", "free-floating"
    ]