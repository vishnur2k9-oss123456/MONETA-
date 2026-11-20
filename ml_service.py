import json
from datetime import datetime
from typing import List

import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert

# Global model singleton (trained on first call)
_model: RandomForestRegressor | None = None

def _train_dummy_model():
    # Very small synthetic dataset: features = [amount, hour_of_day]
    X = np.array([
        [1000, 10], [2000, 14], [500, 9], [1500, 20], [800, 12]
    ])
    y = np.array([1, 2, 1, 3, 2])  # dummy target representing ATM cluster id
    model = RandomForestRegressor(n_estimators=10, random_state=42)
    model.fit(X, y)
    return model

async def get_model():
    global _model
    if _model is None:
        _model = _train_dummy_model()
    return _model

async def predict_for_complaint(complaint, transactions) -> List[dict]:
    """Return a ranked list of ATM predictions.
    Each dict contains: atm_location_id, rank, score.
    """
    model = await get_model()
    # Build feature vectors from transactions (average amount, hour)
    if not transactions:
        return []
    amounts = [float(t.amount) for t in transactions]
    hours = [t.timestamp.hour for t in transactions]
    X = np.array([[np.mean(amounts), np.mean(hours)]])
    pred = model.predict(X)
    # Dummy mapping: treat predicted cluster id as atm_location_id (modulo available ATMs)
    # For illustration we just return a single top‑ranked location with a confidence score.
    score = 0.8  # placeholder confidence
    return [{"atm_location_id": int(pred[0]), "rank": 1, "score": score}]

async def run_prediction_pipeline(db: AsyncSession, complaint_id: int):
    """Orchestrates the full prediction workflow:
    1. Load complaint & related transactions.
    2. Call ``predict_for_complaint``.
    3. Persist ``Prediction`` and ``PredictionLocation`` rows.
    4. Return the freshly created ``Prediction`` ORM object.
    """
    from app.models import Complaint, Transaction, Prediction, PredictionLocation, ModelVersion
    # 1. Load complaint
    result = await db.execute(select(Complaint).where(Complaint.id == complaint_id))
    complaint = result.scalars().first()
    if not complaint:
        raise ValueError('Complaint not found')
    # 2. Load its transactions
    tx_res = await db.execute(select(Transaction).where(Transaction.complaint_id == complaint_id))
    transactions = tx_res.scalars().all()
    # 3. Ensure a model version exists (create a default one if missing)
    mv_res = await db.execute(select(ModelVersion).order_by(ModelVersion.id.desc()))
    model_version = mv_res.scalars().first()
    if not model_version:
        # create a placeholder model version
        stmt = insert(ModelVersion).values(version_name='v0', description='initial placeholder').returning(ModelVersion)
        mv_res = await db.execute(stmt)
        await db.commit()
        model_version = mv_res.fetchone()
    # 4. Predict
    pred_list = await predict_for_complaint(complaint, transactions)
    # 5. Persist Prediction row
    pred_stmt = insert(Prediction).values(
        complaint_id=complaint.id,
        model_version_id=model_version.id,
        confidence=pred_list[0]["score"] if pred_list else 0.0,
        meta={"generated_at": datetime.utcnow().isoformat()},
    ).returning(Prediction)
    pred_res = await db.execute(pred_stmt)
    await db.commit()
    prediction = pred_res.fetchone()
    # 6. Persist PredictionLocation rows
    for loc in pred_list:
        pl_stmt = insert(PredictionLocation).values(
            prediction_id=prediction.id,
            atm_location_id=loc["atm_location_id"],
            rank=loc["rank"],
            score=loc["score"],
        )
        await db.execute(pl_stmt)
    await db.commit()
    # Refresh relationships for response
    await db.refresh(prediction)
    return prediction

async def run_prediction_pipeline(db: AsyncSession, complaint_id: int):
    """Orchestrates the full prediction workflow:
    1. Load complaint & related transactions.
    2. Call ``predict_for_complaint``.
    3. Persist ``Prediction`` and ``PredictionLocation`` rows.
    4. Return the freshly created ``Prediction`` ORM object.
    """
    from app.models import Complaint, Transaction, Prediction, PredictionLocation, ModelVersion
    # 1. Load complaint
    result = await db.execute(select(Complaint).where(Complaint.id == complaint_id))
    complaint = result.scalars().first()
    if not complaint:
        raise ValueError('Complaint not found')
    # 2. Load its transactions
    tx_res = await db.execute(select(Transaction).where(Transaction.complaint_id == complaint_id))
    transactions = tx_res.scalars().all()
    # 3. Ensure a model version exists (create a default one if missing)
    mv_res = await db.execute(select(ModelVersion).order_by(ModelVersion.id.desc()))
    model_version = mv_res.scalars().first()
    if not model_version:
        # create a placeholder model version
        from app.models import ModelVersion as MV
        stmt = insert(MV).values(version_name='v0', description='initial placeholder').returning(MV)
        mv_res = await db.execute(stmt)
        await db.commit()
        model_version = mv_res.fetchone()
    # 4. Predict
    pred_list = await predict_for_complaint(complaint, transactions)
    # 5. Persist Prediction row
    pred_stmt = insert(Prediction).values(
        complaint_id=complaint.id,
        model_version_id=model_version.id,
        confidence=pred_list[0]["score"] if pred_list else 0.0,
        meta={"generated_at": datetime.utcnow().isoformat()},
    ).returning(Prediction)
    pred_res = await db.execute(pred_stmt)
    await db.commit()
    prediction = pred_res.fetchone()
    # 6. Persist PredictionLocation rows
    for loc in pred_list:
        pl_stmt = insert(PredictionLocation).values(
            prediction_id=prediction.id,
            atm_location_id=loc["atm_location_id"],
            rank=loc["rank"],
            score=loc["score"],
        )
        await db.execute(pl_stmt)
    await db.commit()
    # Refresh relationships for response
    await db.refresh(prediction)
    return prediction
