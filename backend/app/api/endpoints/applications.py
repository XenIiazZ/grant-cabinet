#backend/app/api/endpoints/applications.py
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.schemas.application_schemas import ApplicationCreate, ApplicationUpdate, ApplicationResponse
from app.crud.application_crud import application_crud
from app.api.dependencies import check_admin_permission, get_current_user, check_user_permission, get_current_user_optional
from app.database.models.user import User
from app.database.models.grant import Grant
from app.database.models.application import Application
router = APIRouter()

# 1. GET /applications/my - Мои заявки (только мои)
@router.get("/my", response_model=List[ApplicationResponse])
async def get_my_applications(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить мои заявки"""
    applications = application_crud.get_by_user(db, user_id=current_user.id, skip=skip, limit=limit)
    
    # Дополняем информацией о грантах
    result = []
    for app in applications:
        grant = db.query(Grant).filter(Grant.id == app.grant_id).first()
        if grant:
            app_dict = {
                **{c.name: getattr(app, c.name) for c in app.__table__.columns},
                "grant_title": grant.title,
                "grant_organization": "Грантовый кабинет"  # Заменили grant.organization на фиксированное значение
            }
            result.append(ApplicationResponse(**app_dict))
    
    return result

# 2. GET /applications/{application_id} - Конкретная заявка (только владелец)
@router.get("/{application_id}", response_model=ApplicationResponse)
async def get_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить заявку по ID"""
    application = application_crud.get_by_id(db, application_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заявка не найдена"
        )
    
    # Проверяем, что пользователь является владельцем заявки
    if application.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для просмотра этой заявки"
        )
    
    # Добавляем информацию о гранте
    grant = db.query(Grant).filter(Grant.id == application.grant_id).first()
    if grant:
        application_dict = {
            **{c.name: getattr(application, c.name) for c in application.__table__.columns},
            "grant_title": grant.title,
            "grant_organization": "Грантовый кабинет"  # Заменили grant.organization
        }
        return ApplicationResponse(**application_dict)
    
    return application

# 3. POST /applications/ - Создать заявку на грант
@router.post("/", response_model=ApplicationResponse)  # Важно: со слешем
async def create_application(
    application_data: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создать новую заявку на грант"""
    try:
        # Проверяем, существует ли грант
        grant = db.query(Grant).filter(Grant.id == application_data.grant_id).first()
        if not grant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Грант с ID {application_data.grant_id} не найден"
            )
        
        # Проверяем, открыт ли грант для подачи заявок
        if grant.status != "открыт":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Прием заявок на этот грант закрыт"
            )
        
        application = application_crud.create(
            db, 
            application_data, 
            user_id=current_user.id
        )
        
        # Добавляем информацию о гранте
        application_dict = {
            **{c.name: getattr(application, c.name) for c in application.__table__.columns},
            "grant_title": grant.title,
            "grant_organization": "Грантовый кабинет"  # Заменили grant.organization
        }
        return ApplicationResponse(**application_dict)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# 4. PUT /applications/{application_id} - Обновить заявку (только владелец)
@router.put("/{application_id}", response_model=ApplicationResponse)
async def update_application(
    application_id: int,
    application_data: ApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Обновить заявку"""
    application = application_crud.get_by_id(db, application_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заявка не найдена"
        )
    
    # Проверяем, что пользователь является владельцем заявки
    if application.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для редактирования этой заявки"
        )
    
    updated_application = application_crud.update(db, application_id, application_data)
    
    # Добавляем информацию о гранте
    grant = db.query(Grant).filter(Grant.id == updated_application.grant_id).first()
    if grant:
        application_dict = {
            **{c.name: getattr(updated_application, c.name) for c in updated_application.__table__.columns},
            "grant_title": grant.title,
            "grant_organization": "Грантовый кабинет"  # Заменили grant.organization
        }
        return ApplicationResponse(**application_dict)
    
    return updated_application

# 5. DELETE /applications/{application_id} - Удалить заявку (только владелец)
@router.delete("/{application_id}")
async def delete_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Удалить заявку"""
    application = application_crud.get_by_id(db, application_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заявка не найдена"
        )
    
    # Проверяем, что пользователь является владельцем заявки
    if application.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для удаления этой заявки"
        )
    
    success = application_crud.delete(db, application_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Не удалось удалить заявку"
        )
    
    return {"message": "Заявка успешно удалена"}

# 6. POST /applications/{application_id}/submit - Отправить заявку на рассмотрение
@router.post("/{application_id}/submit", response_model=ApplicationResponse)
async def submit_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Отправить заявку на рассмотрение (изменить статус на 'на_рассмотрении')"""
    application = application_crud.get_by_id(db, application_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заявка не найдена"
        )
    
    # Проверяем, что пользователь является владельцем заявки
    if application.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для отправки этой заявки"
        )
    
    # Проверяем, что заявка еще не отправлена
    if application.status == "на_рассмотрении":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Заявка уже отправлена на рассмотрение"
        )
    
    # Создаем Pydantic модель для обновления
    from app.schemas.application_schemas import ApplicationUpdate, ApplicationStatus
    
    update_data = ApplicationUpdate(status=ApplicationStatus.PENDING)
    updated_application = application_crud.update(db, application_id, update_data)
    
    if not updated_application:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Не удалось обновить заявку"
        )
    
    # Добавляем информацию о гранте
    grant = db.query(Grant).filter(Grant.id == updated_application.grant_id).first()
    if grant:
        application_dict = {
            **{c.name: getattr(updated_application, c.name) for c in updated_application.__table__.columns},
            "grant_title": grant.title,
            "grant_organization": "Грантовый кабинет"
        }
        return ApplicationResponse(**application_dict)
    
    return updated_application


# Модель для обновления статуса
class ApplicationStatusUpdate(BaseModel):
    status: str
    feedback: str | None = None

@router.patch("/{application_id}/status")
async def update_application_status(
    application_id: int,
    status_update: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin_permission)  # Только админ может менять статус
):
    """Обновление статуса заявки (только для админа)"""
    application = db.query(Application).filter(Application.id == application_id).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заявка не найдена"
        )
    
    # Обновляем статус
    application.status = status_update.status
    
    # Если есть фидбек, обновляем его
    if status_update.feedback:
        application.feedback = status_update.feedback
    
    db.commit()
    db.refresh(application)
    
    return {
        "message": f"Статус заявки обновлен на {status_update.status}",
        "application": application
    }