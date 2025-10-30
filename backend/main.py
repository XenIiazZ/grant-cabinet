from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Grant Cabinet API",
    description="Backend for Grant Cabinet system",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Grant Cabinet API is running"}

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Grant Cabinet API",
        "timestamp": "2024-01-15T10:00:00Z"
    }

# Mock данные грантов
mock_grants = [
    {
        "id": 1,
        "title": "Поддержка социальных проектов",
        "description": "Грант для некоммерческих организаций",
        "category": "Социальная сфера",
        "status": "open",
        "deadline": "2025-03-15",
        "budget": "2 000 000 ₽",
        "applications": 245
    },
    {
        "id": 2,
        "title": "Развитие культурных инициатив", 
        "description": "Финансирование проектов в области культуры",
        "category": "Культура",
        "status": "closing_soon",
        "deadline": "2025-02-28",
        "budget": "5 000 000 ₽",
        "applications": 89
    }
]

@app.get("/api/grants")
async def get_grants():
    return {
        "success": True,
        "data": mock_grants,
        "count": len(mock_grants)
    }

@app.get("/api/grants/{grant_id}")
async def get_grant(grant_id: int):
    return {
        "success": True,
        "message": f"Grant {grant_id} endpoint - ready for implementation",
        "grant_id": grant_id
    }

@app.post("/api/auth/login")
async def login():
    return {
        "success": True,
        "message": "Login endpoint - ready for implementation"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)