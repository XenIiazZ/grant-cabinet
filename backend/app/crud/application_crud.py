# backend/app/crud/application_crud.py
from sqlalchemy.orm import Session
from app.database.models.application import Application
from app.database.models.grant import Grant
from app.schemas.application_schemas import ApplicationCreate, ApplicationUpdate
from typing import List, Optional, Dict, Any

class ApplicationCRUD:
    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[Application]:
        return db.query(Application).offset(skip).limit(limit).all()
    
    def get_by_id(self, db: Session, application_id: int) -> Optional[Application]:
        return db.query(Application).filter(Application.id == application_id).first()
    
    def get_by_user(self, db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Application]:
        """Получить заявки конкретного пользователя"""
        return db.query(Application)\
            .filter(Application.user_id == user_id)\
            .order_by(Application.created_at.desc())\
            .offset(skip)\
            .limit(limit)\
            .all()
    
    def get_by_grant(self, db: Session, grant_id: int, skip: int = 0, limit: int = 100) -> List[Application]:
        """Получить заявки на конкретный грант"""
        return db.query(Application)\
            .filter(Application.grant_id == grant_id)\
            .order_by(Application.created_at.desc())\
            .offset(skip)\
            .limit(limit)\
            .all()
    
    def create(self, db: Session, application_data: ApplicationCreate, user_id: int) -> Application:
        """Создать новую заявку"""
        print(f"=== CRUD: Создание заявки ===")
        print(f"Данные: {application_data}")
        print(f"Статус в данных: {getattr(application_data, 'status', 'НЕТ')}")
        
        # Проверяем существование гранта
        grant = db.query(Grant).filter(Grant.id == application_data.grant_id).first()
        if not grant:
            raise ValueError(f"Grant with id {application_data.grant_id} not found")
        
        # Преобразуем Pydantic модель в dict
        data_dict = application_data.dict()
        print(f"Dict данные: {data_dict}")
        
        # Добавляем user_id и проверяем статус
        data_dict["user_id"] = user_id
        
        # Если статус не указан, ставим "черновик"
        if "status" not in data_dict or not data_dict["status"]:
            data_dict["status"] = "черновик"
            print("Статус не указан, устанавливаем 'черновик'")
        
        print(f"Итоговые данные для создания: {data_dict}")
        
        # Создаем заявку
        db_application = Application(**data_dict)
        
        db.add(db_application)
        db.commit()
        db.refresh(db_application)
        
        # Обновляем счетчик заявок на гранте
        grant.applicants_count = grant.applicants_count + 1
        db.commit()
        
        print(f"Создана заявка ID: {db_application.id}, статус: {db_application.status}")
        
        return db_application
    
    def update(self, db: Session, application_id: int, application_data: ApplicationUpdate) -> Optional[Application]:
        """Обновить заявку"""
        db_application = self.get_by_id(db, application_id)
        if db_application:
            update_data = application_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_application, field, value)
            db.commit()
            db.refresh(db_application)
        return db_application
    
    def delete(self, db: Session, application_id: int) -> bool:
        """Удалить заявку"""
        db_application = self.get_by_id(db, application_id)
        if db_application:
            # Уменьшаем счетчик заявок на гранте
            grant = db.query(Grant).filter(Grant.id == db_application.grant_id).first()
            if grant and grant.applicants_count > 0:
                grant.applicants_count = grant.applicants_count - 1
            
            db.delete(db_application)
            db.commit()
            return True
        return False

application_crud = ApplicationCRUD()