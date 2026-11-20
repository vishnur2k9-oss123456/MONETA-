from sqlalchemy import Column, String, Integer, BigInteger, Float, Boolean, DateTime, Date, Text, ForeignKey, JSON, Numeric
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, func
from sqlalchemy.orm import relationship
from app.database import Base

class TransactionGraph(Base):
    __tablename__ = "transaction_graphs"
    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    snapshot_time = Column(DateTime(timezone=True), default=func.now())
    graph_data = Column(JSON, nullable=False)  # serialized NetworkX graph (nodes/edges)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    complaint = relationship("Complaint", back_populates="transaction_graph")

