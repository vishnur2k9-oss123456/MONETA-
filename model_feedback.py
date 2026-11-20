from sqlalchemy import Column, String, Integer, BigInteger, Float, Boolean, DateTime, Date, Text, ForeignKey, JSON, Numeric
from datetime import datetime
from sqlalchemy import Column, Integer, ForeignKey, DateTime, Float, JSON, Boolean, func
from sqlalchemy.orm import relationship
from app.database import Base

class ModelFeedback(Base):
    __tablename__ = "model_feedback"
    id = Column(Integer, primary_key=True, index=True)
    model_version_id = Column(Integer, ForeignKey("model_versions.id"), nullable=False)
    prediction_id = Column(Integer, ForeignKey("predictions.id"), nullable=False)
    verified = Column(Boolean, default=False)  # true if outcome verified by officer
    actual_location_id = Column(Integer, ForeignKey("atm_locations.id"), nullable=True)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    model_version = relationship("ModelVersion", back_populates="feedbacks")
    prediction = relationship("Prediction", backref="feedbacks")
    actual_location = relationship("ATMLocation")

