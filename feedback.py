'''Feedback endpoints for model evaluation'''

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app import schemas, models, security, services
from app.database import get_db

router = APIRouter()

@router.post('/', response_model=schemas.feedback.FeedbackCreate, status_code=status.HTTP_201_CREATED)
async def submit_feedback(payload: schemas.feedback.FeedbackCreate,
                          current_user: models.User = Depends(security.get_current_active_user),
                          db: AsyncSession = Depends(get_db)):
    feedback = await services.feedback_service.create_feedback(db, payload.dict())
    return feedback

@router.get('/model/{model_version_id}', response_model=List[schemas.feedback.FeedbackRead])
async def get_model_feedback(model_version_id: int,
                             current_user: models.User = Depends(security.get_current_active_user),
                             db: AsyncSession = Depends(get_db)):
    records = await services.feedback_service.get_feedback_for_model(db, model_version_id)
    return records

