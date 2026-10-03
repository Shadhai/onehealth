# app/pipeline/stage5_correlate.py
from datetime import datetime
from typing import List
from app.schemas.enriched_observation import EnrichedObservation
from app.schemas.insight import OneHealthInsight, RiskColumn, CausalLink


# Stage 5: One Health Correlation Engine
# Calculates the multi-domain One Health Risk Index (0.00–1.00).
#
# The 30/30/20/20 weighting aligns with the Horizon Europe OneAquaHealth
# Health Assessment Framework (Deliverable D6.1): water quality (30%),
# biological health (30%), human exposure (20%), and environmental pressure
# (20%). The implementation applies these domains to the indicators available
# in the citizen observation schema.
# Reference: Horizon Europe OneAquaHealth Deliverable D6.1, Health Assessment
# Framework for Urban Aquatic Ecosystems.
WEIGHTS = {
    "water_quality": 0.30,
    "biological_health": 0.30,
    "human_exposure": 0.20,
    "environmental_pressure": 0.20,
}


# ---------------------------------------------------------------
# Domain scoring functions
# Each returns (score 0.0–1.0, list_of_reasons)
# ---------------------------------------------------------------

def score_water_quality(obs) -> tuple[float, List[str]]:
    """Score based on physicochemical water parameters."""
    score = 0.0
    reasons: List[str] = []

    # pH (verified range from FHIR IG / R002)
    ph = obs.ph
    if ph is not None:
        if ph < 5.0 or ph > 9.5:
            score += 0.4
            reasons.append(f"pH {ph} is outside the healthy freshwater range (5.0–9.5).")
        elif ph < 6.0 or ph > 8.5:
            score += 0.2
            reasons.append(f"pH {ph} is slightly outside the optimal range.")

    # Dissolved oxygen (4 mg/L threshold is widely used for aquatic life)
    do = obs.dissolved_oxygen_mg_l
    if do is not None:
        if do < 4.0:
            score += 0.4
            reasons.append(f"Dissolved oxygen {do} mg/L is critically low for aquatic life.")
        elif do < 6.0:
            score += 0.2
            reasons.append(f"Dissolved oxygen {do} mg/L is below optimal levels.")

    # TDS
    tds = obs.tds_mg_l
    if tds is not None and tds > 1000:
        score += 0.2
        reasons.append(f"TDS {tds} mg/L indicates elevated dissolved solids.")

    # Conductivity
    ec = obs.conductivity_us_cm
    if ec is not None and ec > 1500:
        score += 0.2
        reasons.append(f"Conductivity {ec} µS/cm suggests pollution or saline intrusion.")

    # Nutrients (verified code from D6.1)
    if obs.nutrients_code in ("high", "excessive"):
        score += 0.3
        reasons.append("High nutrient levels detected — eutrophication risk.")

    # Coliforms (verified code)
    if obs.coliforms_code in ("present", "high"):
        score += 0.3
        reasons.append("Coliforms detected — bacterial contamination risk.")

    return min(score, 1.0), reasons


def score_biological_health(obs) -> tuple[float, List[str]]:
    """Score based on biological indicators from the IndicatorsOah model."""
    score = 0.0
    reasons: List[str] = []

    # Macroinvertebrates — verified indicator code
    if obs.macroinvertebrates_code in ("poor", "absent", "sparse"):
        score += 0.4
        reasons.append("Macroinvertebrate community is poor or absent.")
    elif obs.macroinvertebrates_code == "moderate":
        score += 0.15
        reasons.append("Macroinvertebrate community shows moderate diversity.")

    # Fish — verified indicator code
    if obs.fish_code in ("absent", "dead"):
        score += 0.4
        reasons.append("Fish absent or dead — severe habitat stress.")
    elif obs.fish_code == "few":
        score += 0.15
        reasons.append("Few fish observed — possible habitat degradation.")

    # Amphibians — verified indicator from D6.1
    if obs.amphibians_code in ("absent", "declining"):
        score += 0.3
        reasons.append("Amphibian decline — sensitive species stress indicator.")

    # Invasive organisms — verified indicator from D6.1
    if obs.invasive_organisms_code in ("present", "dominant"):
        score += 0.2
        reasons.append("Invasive organisms present — ecosystem imbalance risk.")

    # Riparian vegetation — verified code from FHIR IG
    if obs.riparian_vegetation_code in ("absent", "sparse"):
        score += 0.2
        reasons.append("Riparian vegetation absent or sparse — bank instability risk.")
    elif obs.riparian_vegetation_code == "herbaceous":
        score += 0.1
        reasons.append("Only herbaceous riparian vegetation — limited bank protection.")

    # Diatoms — verified indicator
    if obs.diatoms_code in ("absent", "low"):
        score += 0.15
        reasons.append("Low diatom diversity — possible water quality stress.")

    return min(score, 1.0), reasons


def score_human_exposure(obs, health_context=None) -> tuple[float, List[str]]:
    """Score based on direct and indirect human health risk indicators."""
    score = 0.0
    reasons: List[str] = []

    # Coliforms — direct bacterial risk
    if obs.coliforms_code in ("high", "present"):
        score += 0.5
        reasons.append("Bacterial contamination — direct contact risk.")

    # Pharmaceuticals — verified indicator from D6.1
    if obs.pharmaceuticals_code in ("present", "high"):
        score += 0.3
        reasons.append("Pharmaceuticals detected — long-term exposure risk.")

    # Water smell — sewage/chemical smell
    if obs.water_smell_code in ("sewage", "chemical", "faint chemical"):
        score += 0.3
        reasons.append(f"Water smell '{obs.water_smell_code}' — potential contamination.")

    # Water appearance — oily or foamy
    if obs.water_appearance_code in ("oily", "foamy"):
        score += 0.3
        reasons.append(f"Water appearance '{obs.water_appearance_code}' — pollution indicator.")

    # Health context (if available)
    if health_context:
        if hasattr(health_context, "e_coli_prevalence") and health_context.e_coli_prevalence:
            if health_context.e_coli_prevalence > 10:
                score += 0.2
                reasons.append(f"Local E. coli prevalence {health_context.e_coli_prevalence}%.")

    return min(score, 1.0), reasons


def score_environmental_pressure(obs, weather=None) -> tuple[float, List[str]]:
    """Score based on environmental and anthropogenic pressure."""
    score = 0.0
    reasons: List[str] = []

    # Rainfall — verified: StreamCheck uses rain over 48 hours
    if weather and weather.rainfall_48h_mm is not None:
        if weather.rainfall_48h_mm > 20:
            score += 0.4
            reasons.append(f"Heavy rainfall ({weather.rainfall_48h_mm}mm/48h) — runoff risk.")
        elif weather.rainfall_48h_mm > 10:
            score += 0.2
            reasons.append(f"Moderate rainfall ({weather.rainfall_48h_mm}mm/48h).")

    # Channel modification — verified codes NAT, FAS, CL
    if obs.channel_modification_code in ("channelized", "modified"):
        score += 0.3
        reasons.append("Channel modification detected — reduced habitat quality.")
    if obs.channel_connectivity_code in ("interrupted", "disconnected"):
        score += 0.3
        reasons.append("Channel connectivity interrupted — flow alteration.")

    # Bank condition — verified from D6.1
    if obs.bank_condition_code in ("eroded", "heavily eroded"):
        score += 0.3
        reasons.append(f"Bank condition '{obs.bank_condition_code}' — erosion risk.")

    # Vegetation corridor
    if obs.vegetation_corridor_code in ("absent", "fragmented"):
        score += 0.2
        reasons.append("Vegetation corridor absent or fragmented.")

    return min(score, 1.0), reasons


# ---------------------------------------------------------------
# Main correlation
# ---------------------------------------------------------------

def correlate(enriched: EnrichedObservation) -> OneHealthInsight:
    obs = enriched.observation
    weather = enriched.weather

    wq_score, wq_reasons = score_water_quality(obs)
    bio_score, bio_reasons = score_biological_health(obs)
    exp_score, exp_reasons = score_human_exposure(obs)
    env_score, env_reasons = score_environmental_pressure(obs, weather)

    # Weighted One Health Risk Index
    risk_index = (
        WEIGHTS["water_quality"] * wq_score +
        WEIGHTS["biological_health"] * bio_score +
        WEIGHTS["human_exposure"] * exp_score +
        WEIGHTS["environmental_pressure"] * env_score
    )

    # Risk level thresholds
    if risk_index < 0.25:
        risk_level = "Low"
        risk_colour = "green"
    elif risk_index < 0.55:
        risk_level = "Moderate"
        risk_colour = "yellow"
    else:
        risk_level = "High"
        risk_colour = "red"

    # Causal chain — links between domains
    causal_links: List[CausalLink] = []
    if wq_score > 0.3 and bio_score > 0.3:
        causal_links.append(CausalLink(
            from_domain="water",
            to_domain="biodiversity",
            description="Water quality degradation is stressing aquatic life.",
        ))
    if bio_score > 0.3 and exp_score > 0.3:
        causal_links.append(CausalLink(
            from_domain="biodiversity",
            to_domain="human",
            description="Ecosystem stress signals potential human exposure risk.",
        ))
    if env_score > 0.3 and wq_score > 0.3:
        causal_links.append(CausalLink(
            from_domain="environment",
            to_domain="water",
            description="Environmental pressures are driving water quality decline.",
        ))

    # Build domain columns
    human_col = RiskColumn(
        domain="human",
        risk_level=_level(exp_score),
        score=round(exp_score, 2),
        summary=_human_summary(exp_score),
        reasons=exp_reasons,
        actions=_human_actions(exp_score),
    )
    animal_col = RiskColumn(
        domain="animal",
        risk_level=_level(bio_score),
        score=round(bio_score, 2),
        summary=_animal_summary(bio_score),
        reasons=bio_reasons,
        actions=_animal_actions(bio_score),
    )
    eco_col = RiskColumn(
        domain="ecosystem",
        risk_level=_level(wq_score),
        score=round(wq_score, 2),
        summary=_eco_summary(wq_score),
        reasons=wq_reasons + env_reasons,
        actions=_eco_actions(wq_score),
    )

    return OneHealthInsight(
        observation_id=obs.observation_id,
        research_site=obs.research_site or "unknown",
        risk_index=round(risk_index, 2),
        risk_level=risk_level,
        risk_colour=risk_colour,
        human=human_col,
        animal=animal_col,
        ecosystem=eco_col,
        causal_chain=causal_links,
        confidence=_confidence(obs.completeness_score),
        generated_at=datetime.utcnow(),
    )


# ---------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------

def _level(score: float) -> str:
    if score < 0.25:
        return "Low"
    elif score < 0.55:
        return "Moderate"
    return "High"


def _confidence(completeness: float) -> str:
    if completeness >= 0.8:
        return "High"
    elif completeness >= 0.5:
        return "Medium"
    return "Low"


def _human_summary(score: float) -> str:
    if score < 0.25:
        return "Water appears safe for recreation. Normal precautions apply."
    if score < 0.55:
        return "Caution advised. Avoid swallowing water. Wash hands after contact."
    return "Avoid water contact for 48 hours. Children and pets should stay away."


def _animal_summary(score: float) -> str:
    if score < 0.25:
        return "Aquatic habitat appears healthy. Biodiversity indicators normal."
    if score < 0.55:
        return "Some species may be stressed. Monitor for changes."
    return "Fish and amphibians at risk. Fish kills possible."


def _eco_summary(score: float) -> str:
    if score < 0.25:
        return "Ecosystem stable. Continue regular monitoring."
    if score < 0.55:
        return "Early signs of stress. Nutrient or oxygen imbalance possible."
    return "Ecosystem degradation likely. Intervention recommended."


def _human_actions(score: float) -> List[str]:
    if score < 0.25:
        return ["Continue normal recreation.", "Report any unusual water appearance."]
    if score < 0.55:
        return ["Avoid swimming after rainfall.", "Wash hands after contact.",
                "Report any illness to local health authority."]
    return ["Do not swim or wade.", "Keep pets away.",
            "Report to local health authority immediately."]


def _animal_actions(score: float) -> List[str]:
    if score < 0.25:
        return ["Continue biodiversity monitoring."]
    if score < 0.55:
        return ["Increase observation frequency.",
                "Document any fish or amphibian distress."]
    return ["Investigate potential pollution source.",
            "Alert wildlife protection authorities."]


def _eco_actions(score: float) -> List[str]:
    if score < 0.25:
        return ["Maintain current monitoring schedule."]
    if score < 0.55:
        return ["Collect water samples for lab analysis.",
                "Check for nutrient runoff sources."]
    return ["Initiate remediation assessment.",
            "Consider riparian buffer restoration.",
            "Notify environmental authorities."]


def correlate_batch(enriched_list: List[EnrichedObservation]) -> List[OneHealthInsight]:
    """Correlate a batch of enriched observations."""
    return [correlate(e) for e in enriched_list]