from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from app.schemas.application_schemas import ApplicationResponse
from app.database.session import get_db
from app.database.models.user import User, UserRole
from app.database.models.grant import Grant
from app.database.models.application import Application
from app.api.dependencies import check_admin_permission
from app.schemas.user_schemas import UserResponse
from fastapi import Depends, HTTPException, status
from app.api.dependencies import get_current_user
from app.database.models.user import User

router = APIRouter(tags=["admin"])

class UserStatusUpdate(BaseModel):
    status: str

class UserRoleUpdate(BaseModel):
    role: str

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin_permission)
):
    users = db.query(User).all()
    return users

@router.patch("/users/{user_id}/status")
async def toggle_user_status(
    user_id: int,
    status_update: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin_permission)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя изменить статус самого себя"
        )
    
    user.is_active = (status_update.status == "active")
    db.commit()
    
    return {"message": f"Статус пользователя изменен на {status_update.status}"}

@router.patch("/users/{user_id}/role")
async def change_user_role(
    user_id: int,
    role_update: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin_permission)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя изменить роль самого себя"
        )
    
    if role_update.role == "admin":
        user.role = UserRole.ADMIN
    elif role_update.role == "expert":
        user.role = UserRole.EXPERT
    else:
        user.role = UserRole.USER
    
    db.commit()
    
    return {"message": f"Роль пользователя изменена на {role_update.role}"}

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin_permission)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя удалить самого себя"
        )
    
    db.delete(user)
    db.commit()
    
    return {"message": "Пользователь успешно удален"}

@router.get("/stats")
async def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin_permission)
):
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    total_grants = db.query(Grant).count()
    open_grants = db.query(Grant).filter(Grant.status == "открыт").count()
    total_applications = db.query(Application).count()
    pending_applications = db.query(Application).filter(Application.status == "на_рассмотрении").count()
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_grants": total_grants,
        "open_grants": open_grants,
        "total_applications": total_applications,
        "pending_applications": pending_applications
    }

@router.get("/users/with-stats")
async def get_users_with_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin_permission)
):
    users = db.query(User).all()
    result = []
    
    for user in users:
        apps_count = db.query(Application).filter(Application.user_id == user.id).count()
        result.append({
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "is_active": user.is_active,
            "applications_count": apps_count
        })
    
    return result

@router.get("/applications", response_model=List[ApplicationResponse])
async def get_all_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin_permission),
    skip: int = 0,
    limit: int = 100
):
    """Получить все заявки (только для админа)"""
    applications = db.query(Application).offset(skip).limit(limit).all()
    
    # Добавляем информацию о грантах и пользователях
    result = []
    for app in applications:
        grant = db.query(Grant).filter(Grant.id == app.grant_id).first()
        user = db.query(User).filter(User.id == app.user_id).first()
        
        app_dict = {
            **{c.name: getattr(app, c.name) for c in app.__table__.columns},
            "grant_title": grant.title if grant else "Неизвестный грант",
            "user_email": user.email if user else "Неизвестный пользователь"
        }
        result.append(ApplicationResponse(**app_dict))
    
    return result

