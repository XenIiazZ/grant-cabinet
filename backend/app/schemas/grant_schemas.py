from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# Базовые схемы
class GrantBase(BaseModel):
    title: str = Field(..., min_length=5, max_length=200, example="Грант для IT-стартапов")
    description: str = Field(..., min_length=10, example="Финансирование технологических проектов")
    category: str = Field(..., example="IT")
    budget: float = Field(..., gt=0, example=1000000.0)
    deadline: str = Field(..., example="2024-12-31")

# Для создания гранта
class GrantCreate(GrantBase):
    pass

# Для обновления гранта
class GrantUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=5, max_length=200)
    description: Optional[str] = Field(None, min_length=10)
    category: Optional[str] = None
    budget: Optional[float] = Field(None, gt=0)
    status: Optional[str] = None

# Для ответа API
class GrantResponse(GrantBase):
    id: int
    status: str
    applications_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True  # Работа с ORM