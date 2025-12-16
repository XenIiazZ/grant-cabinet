from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.database.base import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Связи
    grants_created = relationship("Grant", backref="creator", foreign_keys="Grant.created_by")
    applications = relationship("Application", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User {self.id}: {self.email}>"