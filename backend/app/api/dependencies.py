from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from typing import Optional

from app.database.session import get_db
from app.database.models.user import User

SECRET_KEY = "test-secret-key-for-jwt-12345"
ALGORITHM = "HS256"

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Зависимость для получения текущего пользователя из Bearer токена.
    Используется в защищенных эндпоинтах как: current_user: User = Depends(get_current_user)
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Неверные учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = credentials.credentials
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        
        if email is None:
            raise credentials_exception
            
        # Проверяем срок действия токена
        # (уже проверяется в jwt.decode при истечении срока)
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Срок действия токена истек",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError:
        raise credentials_exception
    
    # Ищем пользователя в базе данных
    user = db.query(User).filter(User.email == email).first()
    
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Пользователь деактивирован"
        )
    
    return user


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Опциональная зависимость для получения текущего пользователя.
    Возвращает пользователя, если токен валиден, иначе None.
    Используется в эндпоинтах, которые работают и для анонимных пользователей.
    """
    if credentials is None:
        return None
    
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        
        if email is None:
            return None
            
    except (JWTError, jwt.ExpiredSignatureError):
        return None
    
    # Ищем пользователя в базе данных
    user = db.query(User).filter(User.email == email).first()
    
    if user is None or not user.is_active:
        return None
    
    return user


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> int:
    """
    Быстрая зависимость для получения только ID пользователя.
    Используется когда нужен только ID, а не весь объект пользователя.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Неверные учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = credentials.credentials
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        
        if email is None:
            raise credentials_exception
            
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Срок действия токена истек"
        )
    except JWTError:
        raise credentials_exception
    
    # Ищем пользователя в базе данных (только ID)
    user = db.query(User.id).filter(User.email == email, User.is_active == True).first()
    
    if user is None:
        raise credentials_exception
    
    return user[0]


def check_user_permission(
    user_id: int,
    current_user: User = Depends(get_current_user)
):
    """
    Зависимость для проверки прав пользователя.
    Проверяет, что текущий пользователь имеет доступ к ресурсу.
    """
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для выполнения этого действия"
        )
    return current_user


def check_admin_permission(
    current_user: User = Depends(get_current_user)
):
    """
    Зависимость для проверки административных прав.
    В будущем можно добавить поле is_admin в модель User.
    """
    # Пока все пользователи могут создавать гранты (публичные)
    # В будущем можно добавить: if not current_user.is_admin:
    return current_user