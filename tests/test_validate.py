import json
from app.schemas.raw_observation import RawObservation
from app.pipeline.stage2_normalize import normalize_batch, deduplicate
from app.pipeline.stage3_validate import validate_batch

with open("data/mock_observations.json") as f:
    RAW = [RawObservation(**item) for item in json.load(f)]

NORMALIZED = deduplicate(normalize_batch(RAW))
VALIDATED = validate_batch(NORMALIZED)


def get(submission_id):
    return next(v for v in VALIDATED if v.submission_id == submission_id)


def test_clean_record_has_no_flags():
    v = get("OAH-2026-0001")
    assert v.flags == []
    assert v.validation_status == "valid"


def test_contradictory_rating_flagged():
    v = get("OAH-2026-0011")
    rule_ids = {f.rule_id for f in v.flags}
    assert "R008" in rule_ids
    assert "R009" in rule_ids
    assert "R010" in rule_ids
    assert v.validation_status == "needs_review"


def test_out_of_range_ph_flagged():
    v = get("OAH-2026-0014")
    rule_ids = {f.rule_id for f in v.flags}
    assert "R002" in rule_ids
    assert v.validation_status == "needs_review"


def test_impossible_do_flagged():
    v = get("OAH-2026-0015")
    rule_ids = {f.rule_id for f in v.flags}
    assert "R003" in rule_ids
    assert v.validation_status == "rejected"


def test_fahrenheit_submission_passes_after_conversion():
    v = get("OAH-2026-0010")
    numeric_rules = {"R001", "R002", "R003", "R004", "R005", "R006", "R007"}
    fired = {f.rule_id for f in v.flags} & numeric_rules
    assert fired == set()


def test_partial_record_has_no_flags():
    v = get("OAH-2026-0013")
    assert v.flags == []
    assert v.validation_status == "valid"
