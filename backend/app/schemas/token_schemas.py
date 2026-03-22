from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class RefreshTokenCreate(BaseModel):
    token: str
    user_id: int
    expires_at: datetime

class RefreshTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenRefreshRequest(BaseModel):
    refresh_token: str

class LogoutRequest(BaseModel):
    refresh_token: str