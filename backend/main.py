# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.session import engine
from app.database.base import Base

# Импорты роутеров
from app.api.endpoints.grants import router as grants_router
from app.api.endpoints.applications import router as applications_router
from app.api.endpoints.auth import router as auth_router
from app.api.endpoints.admin import router as admin_router
from app.ai.endpoints import router as ai_router
from app.api.endpoints.files import router as files_router
# Создаем таблицы
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Grant Cabinet API",
    description="Backend for Grant Cabinet system with separate Grants and Applications",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:8080", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роутеры
app.include_router(grants_router, prefix="/api/grants", tags=["grants"])
app.include_router(applications_router, prefix="/api/applications", tags=["applications"])
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(admin_router, prefix="/api/admin", tags=["admin"]) 
app.include_router(ai_router, prefix="/api/ai", tags=["AI Evaluation"])
app.include_router(files_router, prefix="/api", tags=["files"])
# Health check
@app.get("/")
async def root():
    return {
        "message": "Grant Cabinet API v2 is running",
        "endpoints": {
            "grants": "/api/grants",
            "applications": "/api/applications",
            "auth": "/api/auth",
            "admin": "/api/admin",  # ДОЛЖНО БЫТЬ ЗДЕСЬ
            "ai": "/api/ai"
        }
    }

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "version": "2.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)