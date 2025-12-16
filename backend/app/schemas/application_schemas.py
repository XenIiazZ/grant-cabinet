# backend/app/schemas/application_schemas.py
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum

class ApplicationStatus(str, Enum):
    DRAFT = "черновик"
    PENDING = "на_рассмотрении"
    APPROVED = "одобрено"
    REJECTED = "отклонено"
    NEEDS_REVISION = "требует_доработки"

class ApplicationBase(BaseModel):
    project_title: str
    project_description: str
    budget_justification: Optional[str] = None
    timeline: Optional[str] = None
    grant_id: int

class ApplicationCreate(ApplicationBase):
    status: Optional[ApplicationStatus] = None  # ← Должно быть опциональным!
    
    class Config:
        schema_extra = {
            "example": {
                "grant_id": 1,
                "project_title": "Мой проект",
                "project_description": "Описание...",
                "status": "на_рассмотрении"  # ← Пример со статусом
            }
        }
class ApplicationUpdate(BaseModel):
    project_title: Optional[str] = None
    project_description: Optional[str] = None
    budget_justification: Optional[str] = None
    timeline: Optional[str] = None
    status: Optional[ApplicationStatus] = None
    feedback: Optional[str] = None
    ml_evaluation: Optional[Dict[str, Any]] = None

class ApplicationResponse(ApplicationBase):
    id: int
    user_id: int
    status: ApplicationStatus
    grant_title: str  # Название гранта
    grant_organization: str = "Грантовый кабинет"  # Значение по умолчанию
    feedback: Optional[str] = None
    ml_evaluation: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True