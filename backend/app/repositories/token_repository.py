from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime
from typing import Optional, List
import uuid

from app.database.models.token import RefreshToken

class TokenRepository:
    
    def create_refresh_token(self, db: Session, user_id: int, expires_at: datetime) -> RefreshToken:
        """Создать новый refresh token"""
        token = str(uuid.uuid4())  # Генерируем уникальный токен
        db_token = RefreshToken(
            token=token,
            user_id=user_id,
            expires_at=expires_at,
            revoked=False
        )
        db.add(db_token)
        db.commit()
        db.refresh(db_token)
        return db_token
    
    def get_valid_refresh_token(self, db: Session, token: str) -> Optional[RefreshToken]:
        """Получить валидный (не истекший и не отозванный) refresh token"""
        return db.query(RefreshToken).filter(
            and_(
                RefreshToken.token == token,
                RefreshToken.revoked == False,
                RefreshToken.expires_at > datetime.utcnow()
            )
        ).first()
    
    def revoke_refresh_token(self, db: Session, token: str) -> bool:
        """Отозвать refresh token"""
        db_token = db.query(RefreshToken).filter(RefreshToken.token == token).first()
        if db_token:
            db_token.revoked = True
            db.commit()
            return True
        return False
    
    def revoke_all_user_tokens(self, db: Session, user_id: int) -> bool:
        """Отозвать все refresh токены пользователя"""
        db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked == False
        ).update({"revoked": True})
        db.commit()
        return True
    
    def cleanup_expired_tokens(self, db: Session) -> int:
        """Очистить истекшие токены"""
        result = db.query(RefreshToken).filter(
            RefreshToken.expires_at <= datetime.utcnow()
        ).delete()
        db.commit()
        return result

token_repository = TokenRepository()