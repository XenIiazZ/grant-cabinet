from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.session import engine, Base
from app.api.endpoints import grants, auth

# Создаем таблицы
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Grant Cabinet API",
    description="Backend for Grant Cabinet system - BMSTU BVT",
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
app.include_router(grants.router, prefix="/api/grants", tags=["grants"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])

# Health check
@app.get("/")
async def root():
    return {"message": "Grant Cabinet API is running"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "Grant Cabinet API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)