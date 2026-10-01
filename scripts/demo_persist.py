# scripts/demo_persist.py
"""
Build a persistent SQLite database from the mock dataset.
Run from the project root: python scripts/demo_persist.py
"""
import sys
from pathlib import Path

# Ensure the project root is on sys.path so `import app` works
# when this script is run directly (python scripts/demo_persist.py).
ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import asyncio
import json
from app.db import Store
from app.schemas.raw_observation import RawObservation
from app.pipeline.orchestrator import run_pipeline


def main():
    with open("data/mock_observations.json") as f:
        raw = [RawObservation(**item) for item in json.load(f)]

    store = Store("onehealth.db")
    insights = asyncio.run(run_pipeline(raw, store, enrich_weather=False))

    print("Stored {} insights".format(len(insights)))
    print("Raw:        {}".format(store.count("raw_observations")))
    print("Normalized: {}".format(store.count("normalized_observations")))
    print("Validated:  {}".format(store.count("validated_observations")))
    print("Enriched:   {}".format(store.count("enriched_observations")))
    print("Insights:   {}".format(store.count("one_health_insights")))
    print("Bundles:    {}".format(store.count("fhir_bundles")))

    store.close()


if __name__ == "__main__":
    main()