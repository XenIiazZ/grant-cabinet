# backend/app/api/endpoints/grants.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.session import get_db
from app.schemas.grant_schemas import GrantCreate, GrantUpdate, GrantResponse
from app.crud.grant_crud import grant_crud
from app.api.dependencies import get_current_user, get_current_user_optional, allow_expert_admin, check_admin_permission
from app.database.models.user import User
from app.schemas.filters import GrantFilterParams, GrantSortParams, PaginationParams
from typing import Optional
from sqlalchemy import and_, or_, cast, Integer

router = APIRouter()

# 1. GET /grants - Все гранты (публичный доступ, можно без авторизации)
@router.get("/", response_model=List[GrantResponse])
async def get_grants(
    skip: int = 0, 
    limit: int = 100, 
    category: Optional[str] = None,
    status: Optional[str] = None,  # Убрали значение по умолчанию "open"
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Получить список всех публичных грантов"""
    # Фильтры для запроса
    filters = {}
    if category:
        filters["category"] = category
    if status:
        filters["status"] = status
    
    # Получаем гранты
    grants = grant_crud.get_all(db, skip=skip, limit=limit, filters=filters)
    return grants

# 2. GET /grants/{grant_id} - Конкретный грант (публичный)
@router.get("/{grant_id}", response_model=GrantResponse)
async def get_grant(
    grant_id: int, 
    db: Session = Depends(get_db)
):
    """Получить грант по ID"""
    grant = grant_crud.get_by_id(db, grant_id)
    if not grant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Грант не найден"
        )
    return grant

# 3. POST /grants - Создать грант (Теперь только Эксперт или Админ)
@router.post("/", response_model=GrantResponse)
async def create_grant(
    grant_data: GrantCreate,
    current_user: User = Depends(allow_expert_admin), # Защищено ролями
    db: Session = Depends(get_db)
):
    return grant_crud.create_with_owner(db, grant_data, user_id=current_user.id)

# 4. PUT /grants/{grant_id} - Обновить грант (только создатель)
@router.put("/{grant_id}", response_model=GrantResponse)
async def update_grant(
    grant_id: int, 
    grant_data: GrantUpdate, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Обновить грант"""
    existing_grant = grant_crud.get_by_id(db, grant_id)
    if not existing_grant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Грант не найден"
        )
    
    # Проверяем, что пользователь является создателем гранта
    if existing_grant.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для редактирования этого гранта"
        )
    
    updated_grant = grant_crud.update(db, grant_id, grant_data)
    return updated_grant

# 5. DELETE /grants/{grant_id} - Удалить грант (Только Админ)
@router.delete("/{grant_id}")
async def delete_grant(
    grant_id: int,
    current_user: User = Depends(check_admin_permission), # Только админ
    db: Session = Depends(get_db)
):
    """Удалить грант"""
    existing_grant = grant_crud.get_by_id(db, grant_id)
    if not existing_grant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Грант не найден"
        )
    
    # Проверяем, что пользователь является создателем гранта
    if existing_grant.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для удаления этого гранта"
        )
    
    success = grant_crud.delete(db, grant_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Не удалось удалить грант"
        )
    
    return {"message": "Грант успешно удален"}

# 6. GET /grants/categories - Получить все категории грантов
@router.get("/categories")
async def get_grant_categories():
    """Получить список всех доступных категорий грантов"""
    return [
        "Социальная сфера",
        "Образование", 
        "Культура",
        "Экология",
        "Технологии",
        "Молодежная политика",
        "Здравоохранение",
        "Наука",
        "Бизнес",
        "Другое"
    ]


@router.get("/", response_model=List[GrantResponse])
async def get_grants(
    # Фильтрация
    category: Optional[str] = None,
    status: Optional[str] = None,
    min_amount: Optional[int] = None,
    max_amount: Optional[int] = None,
    search: Optional[str] = None,
    # Сортировка
    sort_by: str = "created_at",
    sort_order: str = "desc",
    # Пагинация
    page: int = 1,
    page_size: int = 10,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Получить список грантов с фильтрацией, сортировкой и пагинацией
    """
    query = db.query(Grant)
    
    # Применяем фильтры
    if category:
        query = query.filter(Grant.category == category)
    
    if status:
        query = query.filter(Grant.status == status)
    
    if min_amount:
        query = query.filter(cast(Grant.max_amount, Integer) >= min_amount)
    
    if max_amount:
        query = query.filter(cast(Grant.max_amount, Integer) <= max_amount)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Grant.title.ilike(search_term),
                Grant.description.ilike(search_term)
            )
        )
    
    # Сортировка
    sort_column = getattr(Grant, sort_by, Grant.created_at)
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())
    
    # Пагинация
    total = query.count()
    skip = (page - 1) * page_size
    grants = query.offset(skip).limit(page_size).all()
    
    # Возвращаем с метаинформацией
    return {
        "items": grants,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }