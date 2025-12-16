# backend/app/crud/grant_crud.py
from sqlalchemy.orm import Session
from app.database.models.grant import Grant
from app.schemas.grant_schemas import GrantCreate, GrantUpdate
from typing import List, Optional, Dict

class GrantCRUD:
    def get_all(self, db: Session, skip: int = 0, limit: int = 100, filters: Optional[Dict] = None) -> List[Grant]:
        """Получить все гранты с опциональными фильтрами"""
        query = db.query(Grant)
        
        if filters:
            # Применяем фильтры
            if filters.get("category"):
                query = query.filter(Grant.category == filters["category"])
            if filters.get("status"):
                query = query.filter(Grant.status == filters["status"])
        
        return query.offset(skip).limit(limit).all()
    
    def get_by_id(self, db: Session, grant_id: int) -> Optional[Grant]:
        return db.query(Grant).filter(Grant.id == grant_id).first()
    
    def create(self, db: Session, grant_data: GrantCreate) -> Grant:
        db_grant = Grant(**grant_data.dict())
        db.add(db_grant)
        db.commit()
        db.refresh(db_grant)
        return db_grant
    
    def update(self, db: Session, grant_id: int, grant_data: GrantUpdate) -> Optional[Grant]:
        db_grant = self.get_by_id(db, grant_id)
        if db_grant:
            update_data = grant_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_grant, field, value)
            db.commit()
            db.refresh(db_grant)
        return db_grant
    
    def delete(self, db: Session, grant_id: int) -> bool:
        db_grant = self.get_by_id(db, grant_id)
        if db_grant:
            db.delete(db_grant)
            db.commit()
            return True
        return False
    
    def get_by_user(self, db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Grant]:
        """Получить гранты конкретного пользователя"""
        return db.query(Grant)\
            .filter(Grant.created_by == user_id)\
            .order_by(Grant.created_at.desc())\
            .offset(skip)\
            .limit(limit)\
            .all()
    
    def create_with_owner(self, db: Session, obj_in: GrantCreate, user_id: int) -> Grant:
        """Создать грант с указанием владельца"""
        # Преобразуем Pydantic модель в dict и добавляем user_id
        obj_data = obj_in.dict()
        obj_data["created_by"] = user_id
        
        db_obj = Grant(**obj_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

# Создаем экземпляр для импорта
grant_crud = GrantCRUD()