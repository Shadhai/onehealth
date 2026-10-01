# app/schemas/enriched_observation.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from .validated_observation import ValidatedObservation


class WeatherContext(BaseModel):
    rainfall_48h_mm: Optional[float] = None
    mean_air_temp_c: Optional[float] = None
    hours_matched: Optional[int] = None


class EnrichedObservation(BaseModel):
    observation: ValidatedObservation
    weather: WeatherContext
    enriched_at: datetime