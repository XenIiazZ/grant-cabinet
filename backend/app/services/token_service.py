from datetime import datetime, timedelta
from jose import jwt, JWTError
from typing import Dict, Optional, Tuple
from sqlalchemy.orm import Session

from app.core.config import settings  # Создадим потом
from app.repositories.token_repository import token_repository
from app.schemas.token_schemas import RefreshTokenResponse

class TokenService:
    
    def __init__(self):
        self.SECRET_KEY = "test-secret-key-for-jwt-12345"  # Вынести в config
        self.ALGORITHM = "HS256"
        self.ACCESS_TOKEN_EXPIRE_MINUTES = 15  # 15 минут
        self.REFRESH_TOKEN_EXPIRE_DAYS = 7      # 7 дней
    
    def create_access_token(self, data: Dict) -> str:
        """Создать access token (короткоживущий)"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=self.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire, "type": "access"})  # <-- ВАЖНО: type="access"
        print(f"Создание access token с данными: {to_encode}")
        return jwt.encode(to_encode, self.SECRET_KEY, algorithm=self.ALGORITHM)
    
    def create_refresh_token(self, data: Dict) -> str:
        """Создать refresh token (долгоживущий)"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=self.REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode.update({"exp": expire, "type": "refresh"})  # <-- ВАЖНО: type="refresh"
        print(f"Создание refresh token с данными: {to_encode}")
        return jwt.encode(to_encode, self.SECRET_KEY, algorithm=self.ALGORITHM)


    def verify_token(self, token: str, token_type: str = "access") -> Optional[Dict]:
        try:
            print(f"Проверка токена: {token[:20]}...")  # Для отладки
            payload = jwt.decode(token, self.SECRET_KEY, algorithms=[self.ALGORITHM])
            print(f"Payload: {payload}")
            
            # Проверяем тип токена
            token_type_from_payload = payload.get("type")
            if token_type_from_payload != token_type:
                print(f"Неверный тип токена: ожидался {token_type}, получен {token_type_from_payload}")
                return None
                
            return payload
        except jwt.ExpiredSignatureError:
            print("Токен истек")
            return None
        except JWTError as e:
            print(f"Ошибка валидации токена: {e}")
            return None
    
    def create_token_pair(self, user_id: int, email: str) -> Tuple[str, str]:
        """Создать пару токенов"""
        access_token = self.create_access_token({"sub": email, "user_id": user_id})
        refresh_token = self.create_refresh_token({"sub": email, "user_id": user_id})
        return access_token, refresh_token
    
    def refresh_access_token(self, db: Session, refresh_token: str) -> Optional[RefreshTokenResponse]:
        """Обновить access token по refresh token"""
        # Проверяем refresh token в БД
        db_token = token_repository.get_valid_refresh_token(db, refresh_token)
        if not db_token:
            return None
        
        # Проверяем JWT
        payload = self.verify_token(refresh_token, "refresh")
        if not payload:
            return None
        
        # Создаем новую пару токенов
        user_id = payload.get("user_id")
        email = payload.get("sub")
        
        # Отзываем старый refresh token
        token_repository.revoke_refresh_token(db, refresh_token)
        
        # Создаем новые токены
        new_access_token = self.create_access_token({"sub": email, "user_id": user_id})
        new_refresh_token = self.create_refresh_token({"sub": email, "user_id": user_id})
        
        # Сохраняем новый refresh token в БД
        expires_at = datetime.utcnow() + timedelta(days=self.REFRESH_TOKEN_EXPIRE_DAYS)
        token_repository.create_refresh_token(db, user_id, expires_at)
        
        return RefreshTokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token
        )

token_service = TokenService()