from sqlalchemy import Column, String, Integer, BigInteger, Float, Boolean, DateTime, Date, Text, ForeignKey, JSON, Numeric
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import relationship
from app.database import Base

class InvestigationRecord(Base):
    __tablename__ = "investigation_records"
    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    officer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    notes = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="in_progress")  # in_progress, completed, escalated
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    complaint = relationship("Complaint", back_populates="investigation_records")
    officer = relationship("User", back_populates="audit_logs")

