"""Aggregate data endpoints: per-site summaries and CSV export."""
import csv
import io

from fastapi import APIRouter, Request
from fastapi.responses import Response

from app.db import Store

router = APIRouter()


@router.get("/sites")
def list_sites(request: Request):
    store: Store = request.app.state.store
    return store.get_all_sites_summary()

@router.get("/priority-sites")
def priority_sites(request: Request, limit: int = 3):
    """
    Rank sites by urgency for action.

    Priority score combines:
      - latest risk index           (60% weight)
      - flagged observation count    (25% weight)
      - staleness of last update     (15% weight)

    A site that hasn't been checked in a while, has high risk, and
    has unresolved flags rises to the top.
    """
    from datetime import datetime, timezone

    store: Store = request.app.state.store
    sites = store.get_all_sites_summary()

    now = datetime.now(timezone.utc)

    def staleness_days(iso_str):
        if not iso_str:
            return 30
        try:
            dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
            return max(0.0, (now - dt).total_seconds() / 86400)
        except Exception:
            return 30

    def priority(site):
        risk = float(site.get("latest_risk_index") or 0.0)
        flags = float(site.get("flagged_observation_count") or 0)
        stale = staleness_days(site.get("latest_generated_at"))

        # Normalise each component to 0..1
        risk_n = min(1.0, risk)
        flags_n = min(1.0, flags / 5.0)
        stale_n = min(1.0, stale / 30.0)

        return 0.60 * risk_n + 0.25 * flags_n + 0.15 * stale_n

    ranked = sorted(sites, key=priority, reverse=True)[:limit]

    return [
        {
            "site": s.get("site"),
            "observation_id": s.get("latest_observation_id"),
            "risk_index": s.get("latest_risk_index"),
            "risk_level": s.get("latest_risk_level"),
            "risk_colour": s.get("latest_risk_colour"),
            "flagged_observations": s.get("flagged_observation_count", 0),
            "observations": s.get("observation_count", 0),
            "last_update": s.get("latest_generated_at"),
            "priority_score": round(priority(s), 3),
            "urgency": (
                "Act now" if priority(s) >= 0.60
                else "Monitor" if priority(s) >= 0.30
                else "Stable"
            ),
        }
        for s in ranked
    ]
@router.get("/summary")
def summary(request: Request):
    """Return live aggregate numbers for the landing overview."""
    store: Store = request.app.state.store
    pipeline = {
        "raw": store.count("raw_observations"),
        "normalized": store.count("normalized_observations"),
        "validated": store.count("validated_observations"),
        "enriched": store.count("enriched_observations"),
        "insights": store.count("one_health_insights"),
        "bundles": store.count("fhir_bundles"),
    }

    sites = store.get_all_sites_summary()
    return {
        "pipeline": pipeline,
        "sites": {
            "total": len(sites),
            "high_risk": sum(1 for site in sites if site["latest_risk_level"] == "High"),
            "moderate_risk": sum(1 for site in sites if site["latest_risk_level"] == "Moderate"),
            "low_risk": sum(1 for site in sites if site["latest_risk_level"] == "Low"),
            "flagged_observations": sum(site["flagged_observation_count"] for site in sites),
        },
    }


@router.get("/export/csv")
def export_csv(request: Request, site: str | None = None):
    store: Store = request.app.state.store
    insights = (
        store.get_insights_by_site(site, limit=10000)
        if site
        else store.get_recent_insights(limit=10000)
    )

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow([
        "observation_id", "site", "generated_at", "risk_index", "risk_level",
        "confidence", "human_score", "human_level", "animal_score", "animal_level",
        "ecosystem_score", "ecosystem_level", "causal_link_count",
        "human_reasons", "animal_reasons", "ecosystem_reasons",
    ])
    for insight in insights:
        writer.writerow([
            insight["observation_id"], insight["research_site"], insight["generated_at"],
            insight["risk_index"], insight["risk_level"], insight["confidence"],
            insight["human"]["score"], insight["human"]["risk_level"],
            insight["animal"]["score"], insight["animal"]["risk_level"],
            insight["ecosystem"]["score"], insight["ecosystem"]["risk_level"],
            len(insight["causal_chain"]),
            " | ".join(insight["human"]["reasons"]),
            " | ".join(insight["animal"]["reasons"]),
            " | ".join(insight["ecosystem"]["reasons"]),
        ])

    safe_site = site.replace(" ", "-") if site else "all"
    return Response(
        content=buffer.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="onehealth-lens-{safe_site}.csv"'},
    )