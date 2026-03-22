import enum
# Добавь Enum вот сюда в импорт из sqlalchemy
from sqlalchemy import Column, Integer, String, Boolean, Enum 
from sqlalchemy.orm import relationship
from app.database.base import Base

class UserRole(str, enum.Enum):
    USER = "user"
    EXPERT = "expert"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    
    grants_created = relationship("Grant", backref="creator", foreign_keys="Grant.created_by")
    applications = relationship("Application", back_populates="user", cascade="all, delete-orphan")