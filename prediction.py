"""Pydantic schemas for prediction results and request/response."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

class PredictionLocationSchema(BaseModel):
    atm_location_id: int
    rank: int
    score: float

    class Config:
        orm_mode = True

class PredictionBase(BaseModel):
    complaint_id: int
    model_version_id: int
    confidence: float
    meta: Optional[dict] = None

class PredictionCreate(PredictionBase):
    locations: List[PredictionLocationSchema]

class PredictionRead(PredictionBase):
    id: int
    created_at: datetime
    locations: List[PredictionLocationSchema]

    class Config:
        orm_mode = True
