"""Pydantic schemas for complaints and related entities."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

class ComplaintBase(BaseModel):
    title: str
    description: str
    status: Optional[str] = Field(default="open")

class ComplaintCreate(ComplaintBase):
    owner_id: int

class ComplaintRead(ComplaintBase):
    id: int
    complaint_uid: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    owner_id: int

    class Config:
        orm_mode = True

class ComplaintUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
