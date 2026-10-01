# app/schemas/insight.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class RiskColumn(BaseModel):
    domain: str                    # human | animal | ecosystem
    risk_level: str                # Low | Moderate | High
    score: float                   # 0.0–1.0
    summary: str
    reasons: List[str]
    actions: List[str]


class CausalLink(BaseModel):
    from_domain: str
    to_domain: str
    description: str


class OneHealthInsight(BaseModel):
    observation_id: str
    research_site: str
    risk_index: float
    risk_level: str
    risk_colour: str               # green | yellow | red
    human: RiskColumn
    animal: RiskColumn
    ecosystem: RiskColumn
    causal_chain: List[CausalLink]
    confidence: str                # High | Medium | Low
    generated_at: datetime