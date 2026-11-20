"""Risk service calculates a priority score using multiple factors.
Simplified version:
- transaction amount (sum)
- complaint age
- prediction confidence (if available)
- investigation status
- model version risk weight (placeholder)
It stores/updates a RiskScore row.
"""
from datetime import datetime
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert, update

from app.models import Complaint, Transaction, Prediction, RiskScore, InvestigationRecord

async def calculate_score(db: AsyncSession, complaint_id: int) -> RiskScore | None:
    # Load complaint
    c_res = await db.execute(select(Complaint).where(Complaint.id == complaint_id))
    complaint = c_res.scalars().first()
    if not complaint:
        return None
    # Basic factors
    now = datetime.utcnow()
    age_hours = (now - complaint.created_at).total_seconds() / 3600.0
    # Sum transaction amounts
    tx_res = await db.execute(select(Transaction.amount).where(Transaction.complaint_id == complaint_id))
    amounts = [float(a) for a in tx_res.scalars().all()]
    total_amount = sum(amounts)
    # Latest prediction confidence if any
    pred_res = await db.execute(select(Prediction.confidence).where(Prediction.complaint_id == complaint_id).order_by(Prediction.created_at.desc()))
    confidence = pred_res.scalar_one_or_none() or 0.0
    # Investigation status weight
    inv_res = await db.execute(select(InvestigationRecord.status).where(InvestigationRecord.complaint_id == complaint_id).order_by(InvestigationRecord.updated_at.desc()))
    status = inv_res.scalar_one_or_none() or "open"
    status_weight = {"open": 0.2, "in_progress": 0.5, "closed": 0.0}.get(status, 0.2)
    # Compute raw score (simple linear combination)
    raw = (total_amount / 1000.0) * 0.4 + (age_hours / 24.0) * 0.2 + confidence * 0.3 + status_weight * 0.1
    # Map to priority bucket
    if raw >= 2.5:
        priority = "Critical"
    elif raw >= 1.5:
        priority = "High"
    elif raw >= 0.8:
        priority = "Medium"
    else:
        priority = "Low"
    # Upsert RiskScore
    existing_res = await db.execute(select(RiskScore).where(RiskScore.complaint_id == complaint_id))
    existing = existing_res.scalars().first()
    if existing:
        stmt = update(RiskScore).where(RiskScore.id == existing.id).values(score=raw, priority=priority, calculated_at=now)
        await db.execute(stmt)
        await db.commit()
        await db.refresh(existing)
        return existing
    else:
        stmt = insert(RiskScore).values(complaint_id=complaint_id, score=raw, priority=priority, calculated_at=now).returning(RiskScore)
        result = await db.execute(stmt)
        await db.commit()
        return result.fetchone()

async def get_priority_queue(db: AsyncSession) -> List[RiskScore]:
    # Return all scores ordered by priority and score descending
    priority_order = {"Critical": 1, "High": 2, "Medium": 3, "Low": 4}
    res = await db.execute(select(RiskScore))
    scores = res.scalars().all()
    # sort manually
    scores.sort(key=lambda r: (priority_order.get(r.priority, 5), -r.score))
    return scores
