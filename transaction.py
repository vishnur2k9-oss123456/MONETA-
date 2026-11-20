"""Pydantic schemas for transaction related entities."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

class TransactionBase(BaseModel):
    transaction_id: str
    complaint_id: int
    sender_account_id: int
    receiver_account_id: int
    amount: float
    timestamp: Optional[datetime] = None
    description: Optional[str] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionRead(TransactionBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
