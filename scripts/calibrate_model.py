"""Compare model outputs with an expert-labelled CSV reference set.

CSV columns: submission_id, expected_risk_level
This intentionally requires supplied reference labels; synthetic data alone
cannot establish scientific calibration.
"""
import argparse
import csv
import json
from pathlib import Path

from app.db import Store
from app.pipeline.orchestrator import run_pipeline
from app.schemas.raw_observation import RawObservation
import asyncio


async def main(path: Path) -> None:
    reference = {
        row["submission_id"]: row["expected_risk_level"]
        for row in csv.DictReader(path.open(encoding="utf-8"))
    }
    raw = [RawObservation(**item) for item in json.loads(Path("data/mock_observations.json").read_text())]
    insights = await run_pipeline(raw, Store(":memory:"), enrich_weather=False)
    pairs = [(reference[i.observation_id], i.risk_level) for i in insights if i.observation_id in reference]
    if not pairs:
        raise SystemExit("No reference labels matched the supplied observations")
    accuracy = sum(expected == actual for expected, actual in pairs) / len(pairs)
    print(json.dumps({"labelled_count": len(pairs), "accuracy": round(accuracy, 4)}, indent=2))


parser = argparse.ArgumentParser()
parser.add_argument("reference_csv", type=Path)
asyncio.run(main(parser.parse_args().reference_csv))
