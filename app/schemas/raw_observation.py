# app/schemas/raw_observation.py
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

class RawObservation(BaseModel):
    """
    Raw observation as received from the OAH Citizen Science App or CSV.
    Fields are based on verified sources: StreamCheck, D6.1, and FHIR IG mappings.
    All fields are optional to accommodate incomplete submissions.
    """
    # Core metadata (verified from StreamCheck and network capture)
    submission_id: Optional[str] = None
    user_id: Optional[str] = None
    research_site: Optional[str] = None          # e.g., "Nordre Aker"
    longitude: Optional[float] = None
    latitude: Optional[float] = None
    submitted_at: Optional[datetime] = None
    contextual_notes: Optional[str] = None

    # Channel assessment (verified codes: NAT, FAS, CL)
    channel_form: Optional[str] = None
    channel_modification: Optional[str] = None
    channel_connectivity: Optional[str] = None

    # Water assessment (verified from StreamCheck & FHIR IG mappings)
    water_appearance: Optional[str] = None
    water_colour: Optional[str] = None
    water_smell: Optional[str] = None
    water_flow: Optional[str] = None
    ph: Optional[float] = None
    dissolved_oxygen: Optional[float] = None      # unit may be mg/L or % sat
    water_temperature: Optional[float] = None     # unit may be °C or °F
    tds: Optional[float] = None                   # unit may be mg/L or g/L
    conductivity: Optional[float] = None          # unit may be µS/cm or mS/cm
    nutrients: Optional[str] = None
    pharmaceuticals: Optional[str] = None
    coliforms: Optional[str] = None

    # Margins assessment (verified from FHIR IG: riparianVegetation)
    riparian_vegetation: Optional[str] = None
    vegetation_corridor: Optional[str] = None
    bank_condition: Optional[str] = None

    # Overall rating (verified from StreamCheck: Good, Moderate, Poor)
    overall_rating: Optional[str] = None
    degradation_score: Optional[int] = None       # 1, 2, 3 from D6.1

    # Biological indicators (verified from FHIR IG mappings and D6.1)
    macroinvertebrates: Optional[str] = None
    diatoms: Optional[str] = None
    fish: Optional[str] = None
    macrophytes: Optional[List[str]] = None
    non_native_macrophytes: Optional[List[str]] = None
    birds: Optional[str] = None
    amphibians: Optional[str] = None
    diptera: Optional[str] = None
    ticks: Optional[str] = None
    invasive_organisms: Optional[str] = None
    microbiomes: Optional[str] = None

    # Media (verified from D6.1 and app documentation)
    photo_urls: Optional[List[str]] = None
    video_urls: Optional[List[str]] = None

    # Source tracking
    source: str = "oah_app"                       # oah_app | csv | mock
    ingested_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        extra = "allow"  # tolerate unknown fields until API contract is confirmed