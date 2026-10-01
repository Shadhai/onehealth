# app/pipeline/stage2_normalize.py
import hashlib
from datetime import timezone, datetime
from typing import List
from app.schemas.raw_observation import RawObservation
from app.schemas.normalized_observation import NormalizedObservation


def f_to_c(f: float) -> float:
    """Convert Fahrenheit to Celsius, rounded to 2 decimal places."""
    return round((f - 32) * 5 / 9, 2)


def normalize_units(obs: RawObservation) -> dict:
    """
    Convert known units to SI.
    Assumptions (documented, not invented):
    - Temperature > 45  -> assume Fahrenheit
      - Dissolved oxygen > 20 -> assume % saturation (1 mg/L ~ 11.3% at 20 C)
      - TDS < 1 -> assume g/L (convert to mg/L)
      - Conductivity < 10 -> assume mS/cm (convert to uS/cm)
    """
    updates = {}

    # Temperature
    # Threshold aligned with R005: > 45 C is implausible for a stream,
    # so assume the value is Fahrenheit.
    if obs.water_temperature is not None and obs.water_temperature > 45:
        updates["water_temperature_c"] = f_to_c(obs.water_temperature)
    else:
        updates["water_temperature_c"] = obs.water_temperature

    # Dissolved oxygen
    if obs.dissolved_oxygen is not None and obs.dissolved_oxygen > 20:
        updates["dissolved_oxygen_mg_l"] = round(obs.dissolved_oxygen / 11.3, 2)
    else:
        updates["dissolved_oxygen_mg_l"] = obs.dissolved_oxygen

    # TDS
    if obs.tds is not None and obs.tds < 1:
        updates["tds_mg_l"] = obs.tds * 1000
    else:
        updates["tds_mg_l"] = obs.tds

    # Conductivity
    if obs.conductivity is not None and obs.conductivity < 10:
        updates["conductivity_us_cm"] = obs.conductivity * 1000
    else:
        updates["conductivity_us_cm"] = obs.conductivity

    return updates


def compute_completeness(obs_dict: dict) -> float:
    """Fraction of key fields present (0.0 to 1.0)."""
    key_fields = [
        "ph", "dissolved_oxygen_mg_l", "water_temperature_c",
        "tds_mg_l", "conductivity_us_cm", "overall_rating",
        "macroinvertebrates_code", "riparian_vegetation_code",
        "water_appearance_code", "water_colour_code",
    ]
    present = sum(1 for f in key_fields if obs_dict.get(f) is not None)
    return round(present / len(key_fields), 2)


def normalize(obs: RawObservation) -> NormalizedObservation:
    """Transform a RawObservation into a NormalizedObservation."""
    unit_updates = normalize_units(obs)

    raw_key = f"{obs.submission_id}|{obs.user_id}|{obs.research_site}|{obs.submitted_at}"
    observation_id = hashlib.sha256(raw_key.encode()).hexdigest()[:16]

    normalized_dict = {
        "observation_id": observation_id,
        "submission_id": obs.submission_id,
        "user_id": obs.user_id,
        "research_site": obs.research_site.strip() if obs.research_site else None,
        "longitude": round(obs.longitude, 6) if obs.longitude is not None else None,
        "latitude": round(obs.latitude, 6) if obs.latitude is not None else None,
        "submitted_at_utc": obs.submitted_at.astimezone(timezone.utc) if obs.submitted_at else None,
        "contextual_notes": obs.contextual_notes.strip() if obs.contextual_notes else None,

        "channel_form_code": obs.channel_form,
        "channel_modification_code": obs.channel_modification,
        "channel_connectivity_code": obs.channel_connectivity,

        "water_appearance_code": obs.water_appearance,
        "water_colour_code": obs.water_colour,
        "water_smell_code": obs.water_smell,
        "water_flow_code": obs.water_flow,
        "ph": obs.ph,
        **unit_updates,
        "nutrients_code": obs.nutrients,
        "pharmaceuticals_code": obs.pharmaceuticals,
        "coliforms_code": obs.coliforms,

        "riparian_vegetation_code": obs.riparian_vegetation,
        "vegetation_corridor_code": obs.vegetation_corridor,
        "bank_condition_code": obs.bank_condition,

        "overall_rating": obs.overall_rating,
        "degradation_score": obs.degradation_score,

        "macroinvertebrates_code": obs.macroinvertebrates,
        "diatoms_code": obs.diatoms,
        "fish_code": obs.fish,
        "macrophytes_codes": obs.macrophytes,
        "non_native_macrophytes_codes": obs.non_native_macrophytes,
        "birds_code": obs.birds,
        "amphibians_code": obs.amphibians,
        "diptera_code": obs.diptera,
        "ticks_code": obs.ticks,
        "invasive_organisms_code": obs.invasive_organisms,
        "microbiomes_code": obs.microbiomes,

        "photo_urls": obs.photo_urls,
        "video_urls": obs.video_urls,

        "source": obs.source,
        "normalized_at": datetime.utcnow(),
    }

    normalized_dict["completeness_score"] = compute_completeness(normalized_dict)
    return NormalizedObservation(**normalized_dict)


def normalize_batch(observations: List[RawObservation]) -> List[NormalizedObservation]:
    """Normalize a list of RawObservation objects."""
    return [normalize(obs) for obs in observations]


def deduplicate(observations: List[NormalizedObservation]) -> List[NormalizedObservation]:
    """
    Remove duplicate submissions from the same user at the same site
    within a 60-second window. Keeps the more complete record.
    """
    seen = {}
    unique = []
    for obs in observations:
        key = (obs.user_id, obs.research_site)
        if key in seen:
            prev = seen[key]
            if obs.submitted_at_utc and prev.submitted_at_utc:
                delta = abs(
                    (obs.submitted_at_utc - prev.submitted_at_utc).total_seconds()
                )
                if delta < 60:
                    # Keep the more complete one
                    if obs.completeness_score > prev.completeness_score:
                        unique.remove(prev)
                        unique.append(obs)
                        seen[key] = obs
                    continue
        seen[key] = obs
        unique.append(obs)
    return unique