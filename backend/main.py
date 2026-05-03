# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints.currency import router as currency_router
from app.database.session import engine
from app.database.base import Base
from fastapi import FastAPI, Depends
from fastapi.responses import PlainTextResponse, Response
from sqlalchemy.orm import Session
from app.database.session import get_db

# Импорты роутеров
from app.api.endpoints.grants import router as grants_router
from app.api.endpoints.applications import router as applications_router
from app.api.endpoints.auth import router as auth_router
from app.api.endpoints.admin import router as admin_router
# from app.ai.endpoints import router as ai_router
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
# app.include_router(ai_router, prefix="/api/ai", tags=["AI Evaluation"])
app.include_router(files_router, prefix="/api", tags=["files"])
app.include_router(currency_router, prefix="/api", tags=["currency"])
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


from fastapi.responses import PlainTextResponse, Response

@app.get("/robots.txt", response_class=PlainTextResponse)
async def robots_txt():
    content = """User-agent: *
Allow: /$
Allow: /grants/
Allow: /grant/
Disallow: /login
Disallow: /register
Disallow: /dashboard
Disallow: /admin
Disallow: /apply/
Sitemap: https://yourdomain.com/sitemap.xml
"""
    return content

@app.get("/sitemap.xml")
async def sitemap_xml(db: Session = Depends(get_db)):
    """Генерация sitemap.xml с публичными страницами грантов"""
    from app.database.models.grant import Grant
    grants = db.query(Grant).all()
    base_url = "http://localhost:3000" 
    
    urls = [
        {"loc": base_url, "priority": "1.0", "changefreq": "daily"},
        {"loc": f"{base_url}/grants", "priority": "0.9", "changefreq": "daily"},
    ]
    for grant in grants:
        urls.append({
            "loc": f"{base_url}/grant/{grant.id}",
            "priority": "0.8",
            "changefreq": "weekly"
        })
    
    # Генерация XML
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for url in urls:
        xml += '  <url>\n'
        xml += f'    <loc>{url["loc"]}</loc>\n'
        xml += f'    <priority>{url["priority"]}</priority>\n'
        xml += f'    <changefreq>{url["changefreq"]}</changefreq>\n'
        xml += '  </url>\n'
    xml += '</urlset>'
    
    return Response(content=xml, media_type="application/xml")