from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.schemas.grant_schemas import GrantCreate, GrantUpdate, GrantResponse
from app.crud.grant_crud import grant_crud
from app.api.dependencies import get_current_user
from app.database.models.user import User

router = APIRouter()

# 1. GET /grants - Все гранты (публичный доступ)
@router.get("/", response_model=List[GrantResponse])
async def get_grants(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """Получить список всех грантов"""
    return grant_crud.get_all(db, skip=skip, limit=limit)

# 2. GET /grants/my - Гранты текущего пользователя (требует авторизации)
@router.get("/my", response_model=List[GrantResponse])
async def get_my_grants(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить гранты текущего пользователя"""
    return grant_crud.get_by_user(db, user_id=current_user.id, skip=skip, limit=limit)

# 3. GET /grants/{grant_id} - Конкретный грант (публичный)
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

# 4. POST /grants - Создать грант (требует авторизации)
@router.post("/", response_model=GrantResponse)
async def create_grant(
    grant_data: GrantCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создать новый грант"""
    # Добавляем user_id к данным
    return grant_crud.create_with_owner(db, grant_data, user_id=current_user.id)

# 5. PUT /grants/{grant_id} - Обновить грант (требует авторизации + проверка владельца)
@router.put("/{grant_id}", response_model=GrantResponse)
async def update_grant(
    grant_id: int, 
    grant_data: GrantUpdate, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Обновить грант"""
    # Сначала проверяем, существует ли грант и принадлежит ли пользователю
    existing_grant = grant_crud.get_by_id(db, grant_id)
    if not existing_grant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Грант не найден"
        )
    
    # Проверяем, что пользователь является владельцем гранта
    if existing_grant.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для редактирования этого гранта"
        )
    
    # Обновляем грант
    updated_grant = grant_crud.update(db, grant_id, grant_data)
    return updated_grant

# 6. DELETE /grants/{grant_id} - Удалить грант (требует авторизации + проверка владельца)
@router.delete("/{grant_id}")
async def delete_grant(
    grant_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Удалить грант"""
    # Сначала проверяем, существует ли грант и принадлежит ли пользователю
    existing_grant = grant_crud.get_by_id(db, grant_id)
    if not existing_grant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Грант не найден"
        )
    
    # Проверяем, что пользователь является владельцем гранта
    if existing_grant.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для удаления этого гранта"
        )
    
    # Удаляем грант
    success = grant_crud.delete(db, grant_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Не удалось удалить грант"
        )
    
    return {"message": "Грант успешно удален"}