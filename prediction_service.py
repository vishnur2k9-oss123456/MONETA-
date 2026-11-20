"""Service layer for prediction persistence and retrieval."""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert
from app.models import Prediction, PredictionLocation

async def store_prediction(db: AsyncSession, prediction_obj) -> Prediction:
    # prediction_obj is an ORM Prediction already persisted by ml_service.run_prediction_pipeline
    # Here we simply return it (already stored)
    await db.refresh(prediction_obj)
    return prediction_obj

async def get_prediction(db: AsyncSession, prediction_id: int) -> Prediction | None:
    result = await db.execute(select(Prediction).where(Prediction.id == prediction_id))
    return result.scalars().first()
