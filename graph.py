'''Graph analysis endpoints'''

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app import schemas, models, security, services
from app.database import get_db
router = APIRouter()

@router.get('/{complaint_id}', response_model=dict)
async def get_graph_snapshot(complaint_id: int,
                           current_user: models.User = Depends(security.get_current_active_user),
                           db: AsyncSession = Depends(get_db)):
    # Retrieve stored graph snapshot JSON for the complaint
    result = await db.execute(select(models.TransactionGraph).where(models.TransactionGraph.complaint_id == complaint_id))
    graph = result.scalars().first()
    if not graph:
        raise HTTPException(status_code=404, detail='Graph snapshot not found')
    return {'snapshot_time': graph.snapshot_time, 'graph_data': graph.graph_data}

