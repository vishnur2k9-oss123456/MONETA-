from sqlalchemy import Column, String, Integer, BigInteger, Float, Boolean, DateTime, Date, Text, ForeignKey, JSON, Numeric
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base

class ATMLocation(Base):
    __tablename__ = "atm_locations"
    id = Column(Integer, primary_key=True, index=True)
    bank_id = Column(Integer, ForeignKey("banks.id"), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    bank = relationship("Bank", back_populates="atms")
    predictions = relationship("PredictionLocation", back_populates="atm_location")

