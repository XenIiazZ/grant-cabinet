from sqlalchemy import Column, Integer, String, Text, Float, DateTime
from app.database.base import Base

class Grant(Base):
    __tablename__ = "grants"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    category = Column(String)
    budget = Column(Float)
    deadline = Column(DateTime)