from sqlalchemy import Column, String, Integer, BigInteger, Float, Boolean, DateTime, Date, Text, ForeignKey, JSON, Numeric
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base

class ComplaintRelationship(Base):
    __tablename__ = "complaint_relationships"
    id = Column(Integer, primary_key=True, index=True)
    source_complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    target_complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    relationship_type = Column(String, nullable=False)  # e.g., "shared_account", "shared_atm"
    score = Column(Integer, nullable=False, default=0)  # strength of relationship
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    source = relationship("Complaint", foreign_keys=[source_complaint_id], backref="outgoing_relationships")
    target = relationship("Complaint", foreign_keys=[target_complaint_id], backref="incoming_relationships")

