"""Authentication routes (login, token refresh)."""

from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app import security, schemas, models
from app.database import get_db

router = APIRouter()

@router.post('/login', response_model=schemas.auth.Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    user = await security.authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Incorrect email or password')
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(data={'sub': user.email}, expires_delta=access_token_expires)
    return {'access_token': access_token, 'token_type': 'bearer'}

@router.post('/refresh', response_model=schemas.auth.Token)
async def refresh(token: str = Depends(security.oauth2_scheme)):
    # Simple refresh – re‑issue token using same subject
    payload = security.decode_jwt(token)
    email = payload.get('sub')
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token')
    new_token = security.create_access_token(data={'sub': email})
    return {'access_token': new_token, 'token_type': 'bearer'}
