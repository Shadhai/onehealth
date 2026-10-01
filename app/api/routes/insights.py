# app/api/routes/insights.py
"""Insight endpoints for rendered cards, trends, and validation flags."""
from fastapi import APIRouter, HTTPException, Request

from app.schemas.insight import OneHealthInsight
from app.pipeline.stage7_insight import render_impact_card

router = APIRouter()


def _render(insight_dict: dict) -> dict:
    """Re-hydrate the stored insight dict and render the frontend card."""
    insight = OneHealthInsight(**insight_dict)
    return render_impact_card(insight)


@router.get("")
def list_insights(request: Request, limit: int = 50):
    store = request.app.state.store
    raw = store.get_recent_insights(limit=limit)
    return [_render(item) for item in raw]


@router.get("/site/{site}")
def insights_by_site(request: Request, site: str, limit: int = 50):
    store = request.app.state.store
    return [_render(item) for item in store.get_insights_by_site(site, limit=limit)]


@router.get("/trends/{site}")
def trends_by_site(request: Request, site: str, limit: int = 30):
    """Return a chronological series of risk scores for one site."""
    store = request.app.state.store
    rows = store.get_trends_by_site(site, limit=limit)
    return [
        {
            "observation_id": row["observation_id"],
            "risk_index": row["risk_index"],
            "risk_level": row["risk_level"],
            "generated_at": row["generated_at"],
            "human_score": row["human"]["score"],
            "animal_score": row["animal"]["score"],
            "ecosystem_score": row["ecosystem"]["score"],
            "confidence": row["confidence"],
        }
        for row in rows
    ]


@router.get("/{observation_id}/flags")
def get_flags(request: Request, observation_id: str):
    """Return validation flags attached to one observation."""
    store = request.app.state.store
    validated = store.get_validated(observation_id)
    if not validated:
        raise HTTPException(status_code=404, detail="Validated observation not found")
    flags = validated.get("flags", [])
    return {
        "observation_id": observation_id,
        "validation_status": validated.get("validation_status", "valid"),
        "flags": flags,
        "flag_count": len(flags),
    }


@router.get("/{observation_id}/audit")
def get_audit_trail(request: Request, observation_id: str):
    """Return every persisted pipeline stage for one observation."""
    import json

    store = request.app.state.store
    conn = store.conn
    stages = []

    row = conn.execute(
        "SELECT payload, ingested_at FROM raw_observations "
        "WHERE submission_id = ("
        "  SELECT submission_id FROM normalized_observations "
        "  WHERE observation_id = ?"
        ")",
        (observation_id,),
    ).fetchone()
    if row:
        stages.append({
            "stage": 1,
            "name": "Ingest",
            "timestamp": row["ingested_at"],
            "payload": json.loads(row["payload"]),
        })

    row = conn.execute(
        "SELECT payload, normalized_at, completeness_score FROM normalized_observations "
        "WHERE observation_id = ?",
        (observation_id,),
    ).fetchone()
    if row:
        stages.append({
            "stage": 2,
            "name": "Normalize",
            "timestamp": row["normalized_at"],
            "payload": json.loads(row["payload"]),
            "meta": {"completeness_score": row["completeness_score"]},
        })

    row = conn.execute(
        "SELECT payload, validated_at, validation_status, flag_count FROM validated_observations "
        "WHERE observation_id = ?",
        (observation_id,),
    ).fetchone()
    if row:
        stages.append({
            "stage": 3,
            "name": "Validate",
            "timestamp": row["validated_at"],
            "payload": json.loads(row["payload"]),
            "meta": {
                "validation_status": row["validation_status"],
                "flag_count": row["flag_count"],
            },
        })

    row = conn.execute(
        "SELECT payload, enriched_at FROM enriched_observations "
        "WHERE observation_id = ?",
        (observation_id,),
    ).fetchone()
    if row:
        stages.append({
            "stage": 4,
            "name": "Enrich",
            "timestamp": row["enriched_at"],
            "payload": json.loads(row["payload"]),
        })

    row = conn.execute(
        "SELECT payload, generated_at, risk_index, risk_level FROM one_health_insights "
        "WHERE observation_id = ?",
        (observation_id,),
    ).fetchone()
    if row:
        insight = json.loads(row["payload"])
        stages.append({
            "stage": 5,
            "name": "Correlate",
            "timestamp": row["generated_at"],
            "payload": {
                "risk_index": row["risk_index"],
                "risk_level": row["risk_level"],
                "human": insight.get("human"),
                "animal": insight.get("animal"),
                "ecosystem": insight.get("ecosystem"),
            },
        })
        stages.append({
            "stage": 7,
            "name": "Insight",
            "timestamp": row["generated_at"],
            "payload": {
                "causal_chain": insight.get("causal_chain", []),
                "confidence": insight.get("confidence"),
            },
        })

    row = conn.execute(
        "SELECT bundle, created_at FROM fhir_bundles WHERE observation_id = ?",
        (observation_id,),
    ).fetchone()
    if row:
        bundle = json.loads(row["bundle"])
        stages.append({
            "stage": 6,
            "name": "FHIR Map",
            "timestamp": row["created_at"],
            "payload": {
                "resource_count": len(bundle.get("entry", [])),
                "resource_types": sorted({
                    entry["resource"]["resourceType"]
                    for entry in bundle.get("entry", [])
                }),
            },
        })

    stages.sort(key=lambda stage: stage["stage"])
    return {
        "observation_id": observation_id,
        "stage_count": len(stages),
        "stages": stages,
    }


@router.get("/{observation_id}")
def get_insight(request: Request, observation_id: str):
    store = request.app.state.store
    raw = store.get_insight(observation_id)
    if not raw:
        raise HTTPException(status_code=404, detail="Insight not found")
    return _render(raw)