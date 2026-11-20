from sqlalchemy import Column, String, Integer, BigInteger, Float, Boolean, DateTime, Date, Text, ForeignKey, JSON, Numeric
from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base

class PredictionLocation(Base):
    __tablename__ = "prediction_locations"
    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(Integer, ForeignKey("predictions.id"), nullable=False)
    atm_location_id = Column(Integer, ForeignKey("atm_locations.id"), nullable=False)
    rank = Column(Integer, nullable=False)  # 1 = top prediction, etc.
    score = Column(Float, nullable=False)  # risk/confidence score for this location
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    prediction = relationship("Prediction", back_populates="locations")
    atm_location = relationship("ATMLocation", back_populates="predictions")

