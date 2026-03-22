from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database.session import get_db
from app.database.models.user import User, UserRole
from app.services.token_service import token_service

SECRET_KEY = "test-secret-key-for-jwt-12345"
ALGORITHM = "HS256"
security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Неверные учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = credentials.credentials
    print(f"Получен токен в get_current_user: {token[:20]}...")
    
    try:
        # Используем token_service для проверки
        payload = token_service.verify_token(token, "access")
        if payload is None:
            print("Токен не прошел валидацию")
            raise credentials_exception
            
        email: str = payload.get("sub")
        if email is None:
            print("В токене нет email")
            raise credentials_exception
            
        print(f"Токен валидный, email: {email}")
            
    except (JWTError, jwt.ExpiredSignatureError) as e:
        print(f"Ошибка при проверке токена: {e}")
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None or not user.is_active:
        print(f"Пользователь {email} не найден или не активен")
        raise credentials_exception
        
    print(f"Пользователь найден: {user.email}")
    return user

async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if credentials is None:
        return None
    try:
        token = credentials.credentials
        payload = token_service.verify_token(token, "access")
        if payload is None:
            return None
            
        email: str = payload.get("sub")
        if email is None: 
            return None
            
        user = db.query(User).filter(User.email == email).first()
        if user and not user.is_active:
            return None
        return user
    except:
        return None

class RoleChecker:
    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)):
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail=f"Доступ запрещен. Требуемые роли: {[r.value for r in self.allowed_roles]}"
            )
        return current_user

def check_admin_permission(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Требуются права администратора"
        )
    return current_user

allow_expert_admin = RoleChecker([UserRole.EXPERT, UserRole.ADMIN])

def check_user_permission(
    user_id: int, 
    current_user: User = Depends(get_current_user)
):
    """
    Проверяет, совпадает ли ID владельца ресурса с ID текущего пользователя.
    Используется для защиты доступа к личным данным (заявкам).
    """
    if current_user.id != user_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для выполнения этого действия"
        )
    return current_user