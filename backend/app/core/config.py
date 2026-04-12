from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # JWT настройки
    SECRET_KEY: str = "test-secret-key-for-jwt-12345"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # S3 / MinIO настройки
    S3_BUCKET_NAME: str = "grant-cabinet"
    S3_ENDPOINT_URL: str = "http://localhost:9000"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"
    S3_USE_SSL: bool = False
    
    class Config:
        env_file = ".env"
        extra = "allow"  # Разрешить дополнительные поля

settings = Settings()