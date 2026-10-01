# tests/test_insight.py
import json
from datetime import datetime
from app.schemas.raw_observation import RawObservation
from app.pipeline.stage2_normalize import normalize_batch, deduplicate
from app.pipeline.stage3_validate import validate_batch
from app.pipeline.stage5_correlate import correlate
from app.pipeline.stage7_insight import render_impact_card, render_impact_cards
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


def test_card_has_all_required_fields():
    validated = load_validated()
    v = next(x for x in validated if x.submission_id == "OAH-2026-0001")
    insight = correlate(make_enriched(v))
    card = render_impact_card(insight)

    for key in ("card_id", "observation_id", "site", "risk",
                "confidence", "columns", "causal_chain", "generated_at"):
        assert key in card, f"missing key: {key}"


def test_card_has_three_columns_in_order():
    validated = load_validated()
    v = next(x for x in validated if x.submission_id == "OAH-2026-0007")
    insight = correlate(make_enriched(v))
    card = render_impact_card(insight)

    assert len(card["columns"]) == 3
    assert card["columns"][0]["domain"] == "human"
    assert card["columns"][1]["domain"] == "animal"
    assert card["columns"][2]["domain"] == "ecosystem"


def test_columns_have_icons_and_titles():
    validated = load_validated()
    v = next(x for x in validated if x.submission_id == "OAH-2026-0001")
    card = render_impact_card(correlate(make_enriched(v)))

    for col in card["columns"]:
        assert col["icon"], f"missing icon for {col['domain']}"
        assert col["title"], f"missing title for {col['domain']}"
        assert isinstance(col["reasons"], list)
        assert isinstance(col["actions"], list)


def test_card_risk_hex_matches_level():
    validated = load_validated()
    # High risk
    v_high = next(x for x in validated if x.submission_id == "OAH-2026-0007")
    card_high = render_impact_card(correlate(make_enriched(v_high)))
    assert card_high["risk"]["colour"] == "red"
    assert card_high["risk"]["hex"] == "#c62828"

    # Low risk
    v_low = next(x for x in validated if x.submission_id == "OAH-2026-0001")
    card_low = render_impact_card(correlate(make_enriched(v_low)))
    assert card_low["risk"]["colour"] == "green"
    assert card_low["risk"]["hex"] == "#2e7d32"


def test_card_is_json_serializable():
    validated = load_validated()
    cards = render_impact_cards([
        correlate(make_enriched(v)) for v in validated
    ])
    # Should not raise
    j = json.dumps(cards)
    assert len(j) > 500
    parsed = json.loads(j)
    assert len(parsed) == len(validated)


def test_causal_chain_is_rendered():
    validated = load_validated()
    v = next(x for x in validated if x.submission_id == "OAH-2026-0007")
    card = render_impact_card(correlate(make_enriched(v)))
    # 0007 is severe; at least one causal link expected
    assert len(card["causal_chain"]) >= 1
    for link in card["causal_chain"]:
        assert "from" in link
        assert "to" in link
        assert "description" in link