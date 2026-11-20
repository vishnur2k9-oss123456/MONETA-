'''Transaction service for CRUD operations'''

from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert, update, delete
from app.models import Transaction

async def create_transaction(db: AsyncSession, data: dict) -> Transaction:
    stmt = insert(Transaction).values(**data).returning(Transaction)
    result = await db.execute(stmt)
    await db.commit()
    return result.fetchone()

async def get_transaction(db: AsyncSession, tx_id: int) -> Transaction | None:
    result = await db.execute(select(Transaction).where(Transaction.id == tx_id))
    return result.scalars().first()

async def update_transaction(db: AsyncSession, tx_id: int, updates: dict) -> Transaction | None:
    stmt = update(Transaction).where(Transaction.id == tx_id).values(**updates).returning(Transaction)
    result = await db.execute(stmt)
    await db.commit()
    return result.fetchone()

async def delete_transaction(db: AsyncSession, tx_id: int) -> None:
    stmt = delete(Transaction).where(Transaction.id == tx_id)
    await db.execute(stmt)
    await db.commit()
