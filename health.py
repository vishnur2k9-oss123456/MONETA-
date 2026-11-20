"""Health check routes."""
from fastapi import APIRouter

router = APIRouter()

@router.get('/ping', summary='Simple health check')
async def ping():
    return {'status': 'ok'}
