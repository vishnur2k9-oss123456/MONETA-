"""Service for handling model feedback records.
Provides creation and retrieval of feedback for a given model version.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import insert, select
from app.models import ModelFeedback

async def create_feedback(db: AsyncSession, data: dict) -> ModelFeedback:
    stmt = insert(ModelFeedback).values(**data).returning(ModelFeedback)
    result = await db.execute(stmt)
    await db.commit()
    return result.fetchone()

async def get_feedback_for_model(db: AsyncSession, model_version_id: int):
    stmt = select(ModelFeedback).where(ModelFeedback.model_version_id == model_version_id)
    result = await db.execute(stmt)
    return result.scalars().all()
