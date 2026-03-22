from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import jwt, JWTError
import hashlib
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.database.session import get_db
from app.database.models.user import User, UserRole
from app.services.token_service import token_service
from app.repositories.token_repository import token_repository
from app.schemas.token_schemas import TokenRefreshRequest, LogoutRequest, RefreshTokenResponse
from app.api.dependencies import get_current_user  # <-- ВАЖНО: добавить этот импорт!

router = APIRouter()

# Модели для запросов
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def create_token_pair(self, user_id: int, email: str) -> tuple[str, str]:
    """Создать пару токенов"""
    print(f"Создание токенов для user_id={user_id}, email={email}")
    
    access_token = self.create_access_token({
        "sub": email, 
        "user_id": user_id
    })
    
    refresh_token = self.create_refresh_token({
        "sub": email, 
        "user_id": user_id
    })
    
    # Проверим, что токены создались
    print(f"Access token создан: {access_token[:20]}...")
    print(f"Refresh token создан: {refresh_token[:20]}...")
    
    return access_token, refresh_token


# Регистрация
@router.post("/register", response_model=UserResponse)
async def register(user: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    role = UserRole.ADMIN if user.email.lower() == "admin@grantcabinet.ru" else UserRole.USER
    
    new_user = User(
        email=user.email,
        hashed_password=hash_password(user.password),
        full_name=user.full_name,
        role=role
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return UserResponse(
        id=new_user.id,
        email=new_user.email,
        full_name=new_user.full_name,
        role=new_user.role.value
    )

# Логин
@router.post("/login", response_model=TokenResponse)
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    if user.hashed_password != hash_password(login_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password"
        )
    
    # Создаем пару токенов
    access_token, refresh_token = token_service.create_token_pair(user.id, user.email)
    
    # Сохраняем refresh token в БД
    expires_at = datetime.utcnow() + timedelta(days=token_service.REFRESH_TOKEN_EXPIRE_DAYS)
    token_repository.create_refresh_token(db, user.id, expires_at)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer"
    )

# Обновление токена
@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_request: TokenRefreshRequest,
    db: Session = Depends(get_db)
):
    """Обновить access token по refresh token"""
    result = token_service.refresh_access_token(db, refresh_request.refresh_token)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    return result

# Выход
@router.post("/logout")
async def logout(
    logout_request: LogoutRequest,
    db: Session = Depends(get_db)
):
    """Выход из системы - отзыв refresh token"""
    success = token_repository.revoke_refresh_token(db, logout_request.refresh_token)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid refresh token"
        )
    return {"message": "Successfully logged out"}

# Выход со всех устройств
@router.post("/logout-all")
async def logout_all(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Выход со всех устройств - отзыв всех refresh токенов пользователя"""
    token_repository.revoke_all_user_tokens(db, current_user.id)
    return {"message": "Logged out from all devices"}

# Получение текущего пользователя
@router.get("/me", response_model=UserResponse)
async def get_current_user_endpoint(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        payload = token_service.verify_token(token, "access")
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        email: str = payload.get("sub")
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role.value
        )
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")