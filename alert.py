"""Pydantic schemas for alert notifications."""
from datetime import datetime
from typing import Optional, Dict, Any

from pydantic import BaseModel, Field

class AlertBase(BaseModel):
    officer_id: int
    type: str = Field(..., description='e.g., "high_priority", "new_prediction"')
    payload: Optional[Dict[str, Any]] = None

class AlertCreate(AlertBase):
    pass

class AlertRead(AlertBase):
    id: int
    created_at: datetime
    read_at: Optional[datetime] = None

    class Config:
        orm_mode = True
