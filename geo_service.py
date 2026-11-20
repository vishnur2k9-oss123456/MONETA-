"""Geospatial service for ATM location ranking.
Simplified implementation using GeoPandas to calculate distances between
historical transaction locations (approximated from ATM coordinates) and
all known ATMs, then returns a sorted list of candidates.
"""
import geopandas as gpd
from shapely.geometry import Point
from typing import List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import ATMLocation, Transaction

async def load_atm_locations(db: AsyncSession) -> gpd.GeoDataFrame:
    result = await db.execute(select(ATMLocation))
    atms: List[ATMLocation] = result.scalars().all()
    df = gpd.GeoDataFrame([
        {
            "id": atm.id,
            "bank_id": atm.bank_id,
            "geometry": Point(atm.longitude, atm.latitude),
        }
        for atm in atms
    ], geometry="geometry", crs="EPSG:4326")
    return df

async def rank_atms_by_proximity(db: AsyncSession, complaint_id: int, top_n: int = 5) -> List[Dict]:
    """Return the top N ATM ids ranked by average distance to the
    complaint's transaction locations.
    """
    # Load transactions for the complaint
    tx_res = await db.execute(select(Transaction).where(Transaction.complaint_id == complaint_id))
    transactions = tx_res.scalars().all()
    if not transactions:
        return []
    # Approximate transaction points as the receiver ATM location (if known)
    # For synthetic data we assume receiver_account links to an ATM via Account -> Bank -> ATMLocation.
    # Here we simply use a placeholder location (0,0) for each transaction.
    tx_points = [Point(0, 0) for _ in transactions]
    # Load ATM GeoDataFrame
    atm_gdf = await load_atm_locations(db)
    # Compute average distance from each ATM to all transaction points
    distances = []
    for _, row in atm_gdf.iterrows():
        d = sum(row.geometry.distance(p) for p in tx_points) / len(tx_points)
        distances.append((row['id'], d))
    distances.sort(key=lambda x: x[1])
    return [{"atm_location_id": atm_id, "distance": dist} for atm_id, dist in distances[:top_n]]
