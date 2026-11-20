"""Pydantic schemas for model version information."""
from datetime import datetime
from typing import Optional, Dict, Any

from pydantic import BaseModel, Field

class ModelVersionBase(BaseModel):
    version_name: str
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class ModelVersionCreate(ModelVersionBase):
    pass

class ModelVersionRead(ModelVersionBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
