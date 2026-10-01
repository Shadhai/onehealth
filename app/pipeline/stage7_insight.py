# app/pipeline/stage7_insight.py
"""
Render a OneHealthInsight into a frontend-ready Impact Card JSON.

The card is the hero feature of the project: a three-column visual
that tells a citizen what their observation means for human, animal,
and ecosystem health.

This module is a pure transformation. No external calls, no side
effects. Input: OneHealthInsight. Output: dict.
"""
from typing import Dict, Any
from app.schemas.insight import OneHealthInsight, RiskColumn


# Emoji icons per domain. Verified: StreamCheck uses ecosystem, animals,
# and people as the three One Health domains.
DOMAIN_ICONS = {
    "human": "🧑",
    "animal": "🐟",
    "ecosystem": "🌿",
}

DOMAIN_TITLES = {
    "human": "Human Health",
    "animal": "Animal Health",
    "ecosystem": "Ecosystem Health",
}

# Colour hex values matching the risk_colour field.
RISK_COLOURS = {
    "green": "#2e7d32",
    "yellow": "#f9a825",
    "red": "#c62828",
}


def _render_column(col: RiskColumn) -> Dict[str, Any]:
    return {
        "domain": col.domain,
        "title": DOMAIN_TITLES.get(col.domain, col.domain.title()),
        "icon": DOMAIN_ICONS.get(col.domain, "•"),
        "level": col.risk_level,
        "score": col.score,
        "summary": col.summary,
        "reasons": col.reasons,
        "actions": col.actions,
    }


def render_impact_card(insight: OneHealthInsight) -> Dict[str, Any]:
    """
    Produce the JSON payload for the frontend Impact Card.

    Structure:
      {
        "card_id": ...,
        "site": ...,
        "risk": {"level": ..., "colour": ..., "hex": ..., "index": ...},
        "confidence": ...,
        "columns": [ {human}, {animal}, {ecosystem} ],
        "causal_chain": [ {from, to, description} ],
        "generated_at": ...
      }
    """
    return {
        "card_id": f"card-{insight.observation_id}",
        "observation_id": insight.observation_id,
        "site": insight.research_site,
        "risk": {
            "level": insight.risk_level,
            "colour": insight.risk_colour,
            "hex": RISK_COLOURS.get(insight.risk_colour, "#757575"),
            "index": insight.risk_index,
        },
        "confidence": insight.confidence,
        "columns": [
            _render_column(insight.human),
            _render_column(insight.animal),
            _render_column(insight.ecosystem),
        ],
        "causal_chain": [
            {
                "from": link.from_domain,
                "to": link.to_domain,
                "description": link.description,
            }
            for link in insight.causal_chain
        ],
        "generated_at": insight.generated_at.isoformat(),
    }


def render_impact_cards(insights: list[OneHealthInsight]) -> list[Dict[str, Any]]:
    return [render_impact_card(i) for i in insights]