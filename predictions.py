'''Prediction endpoints'''

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app import schemas, models, security, services
from app.database import get_db

router = APIRouter()

@router.post('/', response_model=schemas.prediction.PredictionRead, status_code=status.HTTP_201_CREATED)
async def create_prediction(payload: schemas.prediction.PredictionCreate,
                            current_user: models.User = Depends(security.get_current_active_user),
                            db: AsyncSession = Depends(get_db)):
    # Run ML model and geospatial ranking via service
    pred = await services.ml_service.run_prediction_pipeline(db, payload.complaint_id)
    # Store prediction and locations
    stored = await services.prediction_service.store_prediction(db, pred)
    return stored

@router.get('/{prediction_id}', response_model=schemas.prediction.PredictionRead)
async def get_prediction(prediction_id: int,
                         current_user: models.User = Depends(security.get_current_active_user),
                         db: AsyncSession = Depends(get_db)):
    pred = await services.prediction_service.get_prediction(db, prediction_id)
    if not pred:
        raise HTTPException(status_code=404, detail='Prediction not found')
    return pred

