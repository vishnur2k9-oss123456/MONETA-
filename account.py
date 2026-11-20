from sqlalchemy import Column, String, Integer, BigInteger, Float, Boolean, DateTime, Date, Text, ForeignKey, JSON, Numeric
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base

class Account(Base):
    __tablename__ = "accounts"
    id = Column(Integer, primary_key=True, index=True)
    account_number = Column(String, unique=True, index=True, nullable=False)
    owner_name = Column(String, nullable=False)
    bank_id = Column(Integer, ForeignKey("banks.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    bank = relationship("Bank", back_populates="accounts")
    sent_transactions = relationship("Transaction", foreign_keys="Transaction.sender_account_id", back_populates="sender_account")
    received_transactions = relationship("Transaction", foreign_keys="Transaction.receiver_account_id", back_populates="receiver_account")

