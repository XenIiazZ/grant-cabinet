from sqlalchemy.orm import Session
from app.database.models.grant import Grant
from app.schemas.grant_schemas import GrantCreate, GrantUpdate
from typing import List, Optional

class GrantCRUD:
    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[Grant]:
        return db.query(Grant).offset(skip).limit(limit).all()
    
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

grant_crud = GrantCRUD()