from sqlalchemy import JSON, Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.base import Base

class Grant(Base):
    __tablename__ = "grants"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    budget_justification = Column(Text, nullable=True)
    timeline = Column(String, nullable=True)
    status = Column(String, default="draft")  # draft, pending, approved, rejected
    
    # Связь с пользователем
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="grants")
    
    # ML оценка (храним как JSON)
    ml_evaluation = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)