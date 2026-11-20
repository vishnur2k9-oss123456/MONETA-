'''Risk prioritization endpoints'''

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app import schemas, models, security, services
from app.database import get_db

router = APIRouter()

@router.get('/score/{complaint_id}', response_model=schemas.risk.RiskScoreRead)
async def get_risk_score(complaint_id: int,
                         current_user: models.User = Depends(security.get_current_active_user),
                         db: AsyncSession = Depends(get_db)):
    score = await services.risk_service.calculate_score(db, complaint_id)
    if not score:
        raise HTTPException(status_code=404, detail='Risk score not found')
    return score

@router.get('/queue', response_model=List[schemas.risk.PriorityQueueItem])
async def get_priority_queue(current_user: models.User = Depends(security.get_current_active_admin),
                               db: AsyncSession = Depends(get_db)):
    queue = await services.risk_service.get_priority_queue(db)
    return queue

