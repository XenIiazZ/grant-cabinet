from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.schemas.grant_schemas import GrantCreate, GrantUpdate, GrantResponse
from app.crud.grant_crud import grant_crud
from app.api.dependencies import get_current_user  # ← импорт зависимости
from app.database.models.user import User

router = APIRouter()

# ВСЕ эндпоинты требуют авторизации (кроме GET / может оставить публичным)

@router.get("/", response_model=List[GrantResponse])
async def get_grants(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
    # current_user: User = Depends(get_current_user)  # можно оставить публичным для просмотра
):
    """Получить список грантов (публичный доступ)"""
    return grant_crud.get_all(db, skip=skip, limit=limit)

@router.get("/{grant_id}", response_model=GrantResponse)
async def get_grant(
    grant_id: int, 
    db: Session = Depends(get_db)
    # current_user: User = Depends(get_current_user)  # можно оставить публичным
):
    """Получить грант по ID (публичный доступ)"""
    grant = grant_crud.get_by_id(db, grant_id)
    if not grant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Грант не найден"
        )
    return grant

@router.post("/", response_model=GrantResponse)
async def create_grant(
    grant_data: GrantCreate,
    current_user: User = Depends(get_current_user),  # ← ЗАЩИЩЕНО: требует авторизации
    db: Session = Depends(get_db)
):
    """Создать новый грант (только для авторизованных)"""
    return grant_crud.create(db, grant_data)

@router.put("/{grant_id}", response_model=GrantResponse)
async def update_grant(
    grant_id: int, 
    grant_data: GrantUpdate, 
    current_user: User = Depends(get_current_user),  # ← ЗАЩИЩЕНО
    db: Session = Depends(get_db)
):
    """Обновить грант (только для авторизованных)"""
    grant = grant_crud.update(db, grant_id, grant_data)
    if not grant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Грант не найден"
        )
    return grant

@router.delete("/{grant_id}")
async def delete_grant(
    grant_id: int,
    current_user: User = Depends(get_current_user),  # ← ЗАЩИЩЕНО
    db: Session = Depends(get_db)
):
    """Удалить грант (только для авторизованных)"""
    success = grant_crud.delete(db, grant_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Грант не найден"
        )
    return {"message": "Грант успешно удален"}