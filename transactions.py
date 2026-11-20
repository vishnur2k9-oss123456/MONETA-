'''Transaction ingestion and retrieval endpoints'''

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app import schemas, models, security, services
from app.database import get_db

router = APIRouter()

@router.post('/', response_model=schemas.transaction.TransactionRead, status_code=status.HTTP_201_CREATED)
async def create_transaction(payload: schemas.transaction.TransactionCreate,
                             current_user: models.User = Depends(security.get_current_active_user),
                             db: AsyncSession = Depends(get_db)):
    """Create a single transaction record after validation."""
    tx = await services.transaction_service.create_transaction(db, payload.dict())
    return tx

@router.get('/{transaction_id}', response_model=schemas.transaction.TransactionRead)
async def get_transaction(transaction_id: int,
                        current_user: models.User = Depends(security.get_current_active_user),
                        db: AsyncSession = Depends(get_db)):
    """Retrieve a transaction by its primary key."""
    tx = await services.transaction_service.get_transaction(db, transaction_id)
    if not tx:
        raise HTTPException(status_code=404, detail='Transaction not found')
    return tx

@router.get('/', response_model=List[schemas.transaction.TransactionRead])
async def list_transactions(skip: int = 0, limit: int = 100,
                          current_user: models.User = Depends(security.get_current_active_user),
                          db: AsyncSession = Depends(get_db)):
    """Paginated list of transactions visible to the caller."""
    result = await db.execute(select(models.Transaction).offset(skip).limit(limit))
    txs = result.scalars().all()
    return txs

