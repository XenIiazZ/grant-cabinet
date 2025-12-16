# backend/app/database/models/application.py
from sqlalchemy import JSON, Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database.base import Base

class ApplicationStatus(str, enum.Enum):
    DRAFT = "черновик"
    PENDING = "на_рассмотрении"
    APPROVED = "одобрено"
    REJECTED = "отклонено"
    NEEDS_REVISION = "требует_доработки"

class Application(Base):
    __tablename__ = "applications"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Связь с грантом (на какой грант подается заявка)
    grant_id = Column(Integer, ForeignKey("grants.id"), nullable=False)
    grant = relationship("Grant", back_populates="applications")
    
    # Связь с пользователем (кто подает заявку)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="applications")
    
    # Данные заявки
    project_title = Column(String, nullable=False)
    project_description = Column(Text, nullable=False)
    budget_justification = Column(Text, nullable=True)
    timeline = Column(String, nullable=True)
    
    # Статус заявки
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.DRAFT)
    
    # ML оценка
    ml_evaluation = Column(JSON, nullable=True)
    
    # Обратная связь от экспертов
    feedback = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)