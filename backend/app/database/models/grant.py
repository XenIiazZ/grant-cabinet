# backend/app/database/models/grant.py
from sqlalchemy import JSON, Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database.base import Base

class GrantCategory(str, enum.Enum):
    SOCIAL = "Социальная сфера"
    EDUCATION = "Образование"
    CULTURE = "Культура"
    ECOLOGY = "Экология"
    TECHNOLOGY = "Технологии"
    YOUTH = "Молодежная политика"
    HEALTH = "Здравоохранение"
    SCIENCE = "Наука"
    BUSINESS = "Бизнес"
    OTHER = "Другое"

class GrantStatus(str, enum.Enum):
    OPEN = "открыт"
    CLOSING_SOON = "скоро_закрывается"
    CLOSED = "закрыт"

class Grant(Base):
    __tablename__ = "grants"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Основная информация о гранте
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    
    # Финансовые условия
    max_amount = Column(String, nullable=True)  # Максимальная сумма гранта
    budget_example = Column(Text, nullable=True)  # Пример бюджета
    
    # Сроки
    deadline = Column(DateTime, nullable=True)  # Дедлайн подачи
    
    # Категория и статус
    category = Column(Enum(GrantCategory), default=GrantCategory.OTHER)
    status = Column(Enum(GrantStatus), default=GrantStatus.OPEN)
    
    # Статистика
    applicants_count = Column(Integer, default=0)  # Количество поданных заявок
    
    # Кто создал грант (администратор)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Связи
    applications = relationship("Application", back_populates="grant", cascade="all, delete-orphan")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Grant {self.id}: {self.title}>"