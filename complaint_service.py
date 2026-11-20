"""Service layer for Complaint CRUD operations."""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert, update, delete
from app.models import Complaint
from datetime import datetime
import uuid

async def create_complaint(db: AsyncSession, data: dict) -> Complaint:
    stmt = insert(Complaint).values(**data).returning(Complaint)
    result = await db.execute(stmt)
    await db.commit()
    return result.fetchone()

async def get_complaint(db: AsyncSession, complaint_id: int) -> Complaint | None:
    result = await db.execute(select(Complaint).where(Complaint.id == complaint_id))
    return result.scalars().first()

async def update_complaint(db: AsyncSession, complaint_id: int, updates: dict) -> Complaint | None:
    stmt = update(Complaint).where(Complaint.id == complaint_id).values(**updates).returning(Complaint)
    result = await db.execute(stmt)
    await db.commit()
    return result.fetchone()

async def delete_complaint(db: AsyncSession, complaint_id: int) -> None:
    stmt = delete(Complaint).where(Complaint.id == complaint_id)
    await db.execute(stmt)
    await db.commit()
