# app/schemas/validated_observation.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from .normalized_observation import NormalizedObservation

class ValidationFlag(BaseModel):
    rule_id: str
    field: str
    severity: str          # ERROR | WARNING | INFO
    value: Optional[float] = None
    message: str
    explanation: str
    z_score: Optional[float] = None

class ValidatedObservation(NormalizedObservation):
    flags: List[ValidationFlag] = []
    validation_status: str = "valid"   # valid | needs_review | rejected
    validated_at: datetime = datetime.utcnow()