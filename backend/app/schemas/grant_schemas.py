from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime

class GrantBase(BaseModel):
    title: str
    description: str
    budget_justification: Optional[str] = None
    timeline: Optional[str] = None
    status: Optional[str] = "draft"

class GrantCreate(GrantBase):
    pass

class GrantUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    budget_justification: Optional[str] = None
    timeline: Optional[str] = None
    status: Optional[str] = None
    ml_evaluation: Optional[Dict[str, Any]] = None  # Для обновления ML оценки

class GrantResponse(GrantBase):
    id: int
    user_id: int
    ml_evaluation: Optional[Dict[str, Any]] = None  # Для хранения ML оценки
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True  # Для SQLAlchemy