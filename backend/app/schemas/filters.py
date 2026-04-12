from pydantic import BaseModel, Field
from typing import Optional, Literal
from enum import Enum

class SortOrder(str, Enum):
    ASC = "asc"
    DESC = "desc"

class GrantFilterParams(BaseModel):
    """Параметры фильтрации грантов"""
    category: Optional[str] = Field(None, description="Категория гранта")
    status: Optional[str] = Field(None, description="Статус гранта (открыт/скоро_закрывается/закрыт)")
    min_amount: Optional[int] = Field(None, description="Минимальная сумма")
    max_amount: Optional[int] = Field(None, description="Максимальная сумма")
    search: Optional[str] = Field(None, description="Поиск по названию и описанию")
    
class GrantSortParams(BaseModel):
    """Параметры сортировки грантов"""
    field: Literal["title", "deadline", "max_amount", "applicants_count", "created_at"] = Field("created_at")
    order: SortOrder = Field(SortOrder.DESC)

class PaginationParams(BaseModel):
    """Параметры пагинации"""
    page: int = Field(1, ge=1, description="Номер страницы")
    page_size: int = Field(10, ge=1, le=100, description="Количество элементов на странице")