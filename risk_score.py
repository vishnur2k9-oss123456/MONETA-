from sqlalchemy import Column, String, Integer, BigInteger, Float, Boolean, DateTime, Date, Text, ForeignKey, JSON, Numeric
from sqlalchemy import String
from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base

class RiskScore(Base):
    __tablename__ = "risk_scores"
    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False, unique=True)
    score = Column(Float, nullable=False)
    priority = Column(String, nullable=False)  # Critical, High, Medium, Low
    calculated_at = Column(DateTime(timezone=True), server_default=func.now())

    complaint = relationship("Complaint", back_populates="risk_score")

