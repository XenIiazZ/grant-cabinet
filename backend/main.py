from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.ai.endpoints import router as ml_router

from app.database.session import engine
from app.database.base import Base
from app.api.endpoints.grants import router as grants_router
from app.api.endpoints.auth import router as auth_router

# Импортируем модели для регистрации
from app.database.models import grant, user

# Создаем таблицы
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Grant Cabinet API",
    description="Backend for Grant Cabinet system",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роутеры
app.include_router(grants_router, prefix="/api/grants", tags=["grants"])
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(ml_router, prefix="/api/ai", tags=["ML Grant Evaluation"])

# Health check
@app.get("/")
async def root():
    return {"message": "Grant Cabinet API is running"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "Grant Cabinet API"}

@app.get("/api/test")
async def test():
    return {"message": "Test endpoint works!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)