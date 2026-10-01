# app/pipeline/orchestrator.py
"""
End-to-end pipeline orchestrator.
Runs stages 2-6 and persists each stage's output to the Store.

Stage 1 (ingest) is called separately because the source varies
(API, CSV, mock). Everything downstream is unified.
"""
from datetime import datetime
from typing import List, Optional

from app.db import Store
from app.schemas.raw_observation import RawObservation
from app.schemas.enriched_observation import EnrichedObservation, WeatherContext
from app.schemas.insight import OneHealthInsight
from app.pipeline.stage2_normalize import normalize_batch, deduplicate
from app.pipeline.stage3_validate import validate_batch
from app.pipeline.stage4_enrich import enrich
from app.pipeline.stage5_correlate import correlate_batch
from app.pipeline.stage6_fhir import to_fhir_bundle, serialize_bundle


async def run_pipeline(
    raw_observations: List[RawObservation],
    store: Store,
    enrich_weather: bool = True,
) -> List[OneHealthInsight]:
    """
    Run the pipeline from raw observations through stored insights.

    Args:
        raw_observations: list of raw inputs (already ingested)
        store: SQLite Store instance for persistence
        enrich_weather: if False, skip live Open-Meteo calls
                        (useful for offline tests)

    Returns:
        The list of OneHealthInsight objects produced.
    """

    # Persist raw
    for raw in raw_observations:
        store.save_raw(raw)

    # Stage 2: Normalize + dedupe
    normalized = deduplicate(normalize_batch(raw_observations))
    for n in normalized:
        store.save_normalized(n)

    # Stage 3: Validate
    validated = validate_batch(normalized)
    for v in validated:
        store.save_validated(v)

    # Stage 4: Enrich
    enriched_list: List[EnrichedObservation] = []
    for v in validated:
        if enrich_weather and v.latitude is not None and v.longitude is not None:
            e = await enrich(v)
        else:
            e = EnrichedObservation(
                observation=v,
                weather=WeatherContext(),
                enriched_at=datetime.utcnow(),
            )
        store.save_enriched(e)
        enriched_list.append(e)

    # Stage 5: Correlate
    insights = correlate_batch(enriched_list)
    for i in insights:
        store.save_insight(i)

    # Stage 6: FHIR Map
    for e, i in zip(enriched_list, insights):
        bundle = to_fhir_bundle(e, i)
        store.save_fhir_bundle(i.observation_id, serialize_bundle(bundle))

    return insights