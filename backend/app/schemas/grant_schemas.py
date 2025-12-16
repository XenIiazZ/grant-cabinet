# backend/app/schemas/grant_schemas.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class GrantCategory(str, Enum):
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

class GrantStatus(str, Enum):
    OPEN = "открыт"
    CLOSING_SOON = "скоро_закрывается"
    CLOSED = "закрыт"

class GrantBase(BaseModel):
    title: str
    description: str
    max_amount: Optional[str] = None
    budget_example: Optional[str] = None
    deadline: Optional[datetime] = None
    category: GrantCategory = GrantCategory.OTHER
    status: GrantStatus = GrantStatus.OPEN

class GrantCreate(GrantBase):
    pass

class GrantUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    max_amount: Optional[str] = None
    budget_example: Optional[str] = None
    deadline: Optional[datetime] = None
    category: Optional[GrantCategory] = None
    status: Optional[GrantStatus] = None
    applicants_count: Optional[int] = None

class GrantResponse(GrantBase):
    id: int
    created_by: int
    applicants_count: int = 0
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True