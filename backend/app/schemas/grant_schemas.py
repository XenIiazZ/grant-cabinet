from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class GrantBase(BaseModel):
    title: str
    description: str
    category: str
    budget: float
    deadline: datetime

class GrantCreate(GrantBase):
    pass

class GrantUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    budget: Optional[float] = None
    deadline: Optional[datetime] = None

class GrantResponse(GrantBase):
    id: int
    
    class Config:
        from_attributes = True