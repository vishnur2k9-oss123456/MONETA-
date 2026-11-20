'''Complaint management endpoints'''

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app import schemas, models, security, services
from app.database import get_db

router = APIRouter()

@router.post('/', response_model=schemas.complaint.ComplaintRead, status_code=status.HTTP_201_CREATED)
async def create_complaint(payload: schemas.complaint.ComplaintCreate,
                         current_user: models.User = Depends(security.get_current_active_user),
                         db: AsyncSession = Depends(get_db)):
    # Generate unique UID (simple UUID for demo)
    import uuid
    payload_dict = payload.dict()
    payload_dict['complaint_uid'] = str(uuid.uuid4())
    payload_dict['owner_id'] = current_user.id
    complaint = await services.complaint_service.create_complaint(db, payload_dict)
    return complaint

@router.get('/{complaint_id}', response_model=schemas.complaint.ComplaintRead)
async def get_complaint(complaint_id: int,
                       current_user: models.User = Depends(security.get_current_active_user),
                       db: AsyncSession = Depends(get_db)):
    complaint = await services.complaint_service.get_complaint(db, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail='Complaint not found')
    return complaint

@router.put('/{complaint_id}', response_model=schemas.complaint.ComplaintRead)
async def update_complaint(complaint_id: int,
                           payload: schemas.complaint.ComplaintUpdate,
                           current_user: models.User = Depends(security.get_current_active_user),
                           db: AsyncSession = Depends(get_db)):
    complaint = await services.complaint_service.update_complaint(db, complaint_id, payload.dict(exclude_unset=True))
    if not complaint:
        raise HTTPException(status_code=404, detail='Complaint not found')
    return complaint

@router.delete('/{complaint_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_complaint(complaint_id: int,
                           current_user: models.User = Depends(security.get_current_active_admin),
                           db: AsyncSession = Depends(get_db)):
    await services.complaint_service.delete_complaint(db, complaint_id)
    return None

