# app/schemas/normalized_observation.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class NormalizedObservation(BaseModel):
    """
    Normalized observation with SI units and canonical codes.
    Based on verified fields from RawObservation.
    """
    observation_id: str                           # deterministic hash
    submission_id: Optional[str] = None
    user_id: Optional[str] = None
    research_site: Optional[str] = None
    longitude: Optional[float] = None             # WGS84, 6 decimal places
    latitude: Optional[float] = None              # WGS84, 6 decimal places
    submitted_at_utc: Optional[datetime] = None
    contextual_notes: Optional[str] = None

    # Channel
    channel_form_code: Optional[str] = None       # NAT | FAS | CL | ...
    channel_modification_code: Optional[str] = None
    channel_connectivity_code: Optional[str] = None

    # Water (SI units)
    water_appearance_code: Optional[str] = None
    water_colour_code: Optional[str] = None
    water_smell_code: Optional[str] = None
    water_flow_code: Optional[str] = None
    ph: Optional[float] = None                    # 0–14
    dissolved_oxygen_mg_l: Optional[float] = None # mg/L
    water_temperature_c: Optional[float] = None   # °C
    tds_mg_l: Optional[float] = None              # mg/L
    conductivity_us_cm: Optional[float] = None    # µS/cm
    nutrients_code: Optional[str] = None
    pharmaceuticals_code: Optional[str] = None
    coliforms_code: Optional[str] = None

    # Margins
    riparian_vegetation_code: Optional[str] = None
    vegetation_corridor_code: Optional[str] = None
    bank_condition_code: Optional[str] = None

    # Overall
    overall_rating: Optional[str] = None          # Good | Moderate | Poor
    degradation_score: Optional[int] = None       # 1 | 2 | 3

    # Biological
    macroinvertebrates_code: Optional[str] = None
    diatoms_code: Optional[str] = None
    fish_code: Optional[str] = None
    macrophytes_codes: Optional[List[str]] = None
    non_native_macrophytes_codes: Optional[List[str]] = None
    birds_code: Optional[str] = None
    amphibians_code: Optional[str] = None
    diptera_code: Optional[str] = None
    ticks_code: Optional[str] = None
    invasive_organisms_code: Optional[str] = None
    microbiomes_code: Optional[str] = None

    # Media
    photo_urls: Optional[List[str]] = None
    video_urls: Optional[List[str]] = None

    # Data quality
    completeness_score: float = 0.0               # 0.0–1.0
    source: str = "oah_app"
    normalized_at: datetime = datetime.utcnow()