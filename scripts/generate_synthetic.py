"""
Generate a synthetic observation dataset for load testing.
Deterministic - same seed always produces the same records.

The distribution of values is intentionally realistic:
  - 60% of sites healthy (Low risk)
  - 30% moderate
  - 10% problematic (High risk)
  - Timestamps spread across 90 days
  - Units include some Fahrenheit and %-saturation to test normalization
"""
import json
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

SEED = 42
N_OBSERVATIONS = 500
N_SITES = 25
DAYS_SPAN = 90

CATEGORIES = {
    "healthy": {
        "weight": 0.60,
        "ph": (6.8, 8.2),
        "do": (7.5, 11.0),
        "temp": (12.0, 17.0),
        "tds": (150.0, 380.0),
        "conductivity": (200.0, 550.0),
        "nutrients": ["low"],
        "coliforms": ["absent"],
        "pharmaceuticals": ["absent"],
        "overall_rating": ["Good"],
        "degradation_score": [1],
        "macroinvertebrates": ["abundant", "moderate"],
        "diatoms": ["diverse", "moderate"],
        "fish": ["present"],
        "amphibians": ["present"],
        "riparian_vegetation": ["trees"],
        "bank_condition": ["stable"],
        "water_appearance": ["clear"],
        "water_smell": ["none"],
        "water_colour": ["colourless"],
        "water_flow": ["moderate"],
        "channel_form": ["NAT"],
        "channel_modification": ["none"],
        "channel_connectivity": ["continuous"],
        "vegetation_corridor": ["continuous"],
        "birds": ["present"],
        "diptera": ["low"],
        "ticks": ["absent"],
        "invasive_organisms": ["absent"],
        "microbiomes": ["balanced"],
    },
    "moderate": {
        "weight": 0.30,
        "ph": (6.2, 7.2),
        "do": (5.0, 7.2),
        "temp": (15.0, 20.0),
        "tds": (350.0, 720.0),
        "conductivity": (500.0, 1100.0),
        "nutrients": ["moderate"],
        "coliforms": ["absent", "present"],
        "pharmaceuticals": ["absent", "present"],
        "overall_rating": ["Moderate"],
        "degradation_score": [2],
        "macroinvertebrates": ["moderate", "sparse"],
        "diatoms": ["moderate", "low"],
        "fish": ["present", "few"],
        "amphibians": ["present", "few"],
        "riparian_vegetation": ["bushes", "herbaceous"],
        "bank_condition": ["slightly eroded", "eroded"],
        "water_appearance": ["murky", "clear"],
        "water_smell": ["none", "earthy"],
        "water_colour": ["brown", "greenish"],
        "water_flow": ["slow", "moderate"],
        "channel_form": ["FAS", "NAT"],
        "channel_modification": ["channelized"],
        "channel_connectivity": ["interrupted", "continuous"],
        "vegetation_corridor": ["patchy"],
        "birds": ["present", "few"],
        "diptera": ["moderate"],
        "ticks": ["absent"],
        "invasive_organisms": ["absent", "present"],
        "microbiomes": ["slightly imbalanced"],
    },
    "poor": {
        "weight": 0.10,
        "ph": (4.8, 6.2),
        "do": (2.0, 4.5),
        "temp": (18.0, 24.0),
        "tds": (900.0, 1500.0),
        "conductivity": (1500.0, 2500.0),
        "nutrients": ["high"],
        "coliforms": ["present", "high"],
        "pharmaceuticals": ["present"],
        "overall_rating": ["Poor"],
        "degradation_score": [3],
        "macroinvertebrates": ["sparse", "absent"],
        "diatoms": ["low", "absent"],
        "fish": ["absent", "dead"],
        "amphibians": ["absent"],
        "riparian_vegetation": ["herbaceous", "absent"],
        "bank_condition": ["eroded", "heavily eroded"],
        "water_appearance": ["turbid", "oily"],
        "water_smell": ["sewage", "chemical"],
        "water_colour": ["brown", "grey"],
        "water_flow": ["slow", "stagnant"],
        "channel_form": ["CL", "FAS"],
        "channel_modification": ["channelized"],
        "channel_connectivity": ["interrupted"],
        "vegetation_corridor": ["absent", "patchy"],
        "birds": ["few", "absent"],
        "diptera": ["high"],
        "ticks": ["absent", "present"],
        "invasive_organisms": ["present"],
        "microbiomes": ["imbalanced", "severely imbalanced"],
    },
}


def pick_category(rng):
    r = rng.random()
    if r < CATEGORIES["healthy"]["weight"]:
        return "healthy"
    if r < CATEGORIES["healthy"]["weight"] + CATEGORIES["moderate"]["weight"]:
        return "moderate"
    return "poor"


def pick(rng, options):
    return rng.choice(options)


def uniform(rng, lo, hi, digits=2):
    return round(rng.uniform(lo, hi), digits)


def make_record(rng, idx, sites, base_time):
    site = rng.choice(sites)
    category = CATEGORIES[pick_category(rng)]

    temp = uniform(rng, *category["temp"])
    if rng.random() < 0.08:
        temp = round(temp * 9 / 5 + 32, 2)

    dissolved_oxygen = uniform(rng, *category["do"])
    if rng.random() < 0.08:
        dissolved_oxygen = round(dissolved_oxygen * 11.3, 2)

    tds = uniform(rng, *category["tds"])
    if rng.random() < 0.05:
        tds = round(tds / 1000, 4)

    conductivity = uniform(rng, *category["conductivity"])
    if rng.random() < 0.05:
        conductivity = round(conductivity / 1000, 4)

    submitted = base_time + timedelta(
        days=rng.uniform(0, DAYS_SPAN),
        hours=rng.uniform(0, 24),
    )

    return {
        "submission_id": f"SYN-{idx:05d}",
        "user_id": f"user-{rng.randint(1000, 1999)}",
        "research_site": site,
        "longitude": round(10.70 + rng.uniform(-0.1, 0.1), 6),
        "latitude": round(59.90 + rng.uniform(-0.05, 0.05), 6),
        "submitted_at": submitted.isoformat(),
        "contextual_notes": f"Synthetic load test observation {idx}",
        "channel_form": pick(rng, category["channel_form"]),
        "channel_modification": pick(rng, category["channel_modification"]),
        "channel_connectivity": pick(rng, category["channel_connectivity"]),
        "water_appearance": pick(rng, category["water_appearance"]),
        "water_colour": pick(rng, category["water_colour"]),
        "water_smell": pick(rng, category["water_smell"]),
        "water_flow": pick(rng, category["water_flow"]),
        "ph": uniform(rng, *category["ph"]),
        "dissolved_oxygen": dissolved_oxygen,
        "water_temperature": temp,
        "tds": tds,
        "conductivity": conductivity,
        "nutrients": pick(rng, category["nutrients"]),
        "pharmaceuticals": pick(rng, category["pharmaceuticals"]),
        "coliforms": pick(rng, category["coliforms"]),
        "riparian_vegetation": pick(rng, category["riparian_vegetation"]),
        "vegetation_corridor": pick(rng, category["vegetation_corridor"]),
        "bank_condition": pick(rng, category["bank_condition"]),
        "overall_rating": pick(rng, category["overall_rating"]),
        "degradation_score": pick(rng, category["degradation_score"]),
        "macroinvertebrates": pick(rng, category["macroinvertebrates"]),
        "diatoms": pick(rng, category["diatoms"]),
        "fish": pick(rng, category["fish"]),
        "amphibians": pick(rng, category["amphibians"]),
        "birds": pick(rng, category["birds"]),
        "diptera": pick(rng, category["diptera"]),
        "ticks": pick(rng, category["ticks"]),
        "invasive_organisms": pick(rng, category["invasive_organisms"]),
        "microbiomes": pick(rng, category["microbiomes"]),
        "macrophytes": rng.sample(
            ["broad-leaved-herbs", "floating-leaved", "free-floating"],
            k=rng.randint(0, 3),
        ),
        "non_native_macrophytes": [],
        "photo_urls": [],
        "video_urls": [],
        "source": "synthetic",
    }


def main():
    rng = random.Random(SEED)
    base_time = datetime(2026, 9, 30, tzinfo=timezone.utc)
    sites = [f"Riverdale Creek - Segment {i}" for i in range(1, N_SITES + 1)]
    records = [make_record(rng, i + 1, sites, base_time) for i in range(N_OBSERVATIONS)]

    out_path = Path("data/synthetic_observations.json")
    out_path.write_text(json.dumps(records, indent=2), encoding="utf-8")
    print(f"Wrote {len(records)} records to {out_path}")


if __name__ == "__main__":
    main()
