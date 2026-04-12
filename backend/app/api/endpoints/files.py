from fastapi import APIRouter, Depends, HTTPException, UploadFile, File as FastAPIFile, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import os
import uuid

from app.database.session import get_db
from app.database.models import File as FileModel
from app.database.models import Application
from app.api.dependencies import get_current_user
from app.database.models.user import User
from app.schemas.file_schemas import FileResponse, FileUploadResponse
from app.services.s3_service import s3_service  # Используем S3 сервис

router = APIRouter()

# Максимальный размер файла: 10 MB
MAX_FILE_SIZE = 10 * 1024 * 1024

# Допустимые типы файлов
ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]


@router.post("/applications/{application_id}/files", response_model=FileUploadResponse)
async def upload_file(
    application_id: int,
    file: UploadFile = FastAPIFile(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Загрузить файл для заявки в MinIO"""
    
    # Проверяем существование заявки
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    
    # Проверяем права доступа
    if application.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Нет прав на загрузку файлов для этой заявки")
    
    # Проверяем размер файла
    file_content = await file.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"Файл слишком большой. Максимум {MAX_FILE_SIZE // 1024 // 1024} MB")
    
    # Проверяем тип файла
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail=f"Недопустимый тип файла. Разрешены: PDF, JPEG, PNG, DOC, DOCX")
    
    try:
        # Загружаем файл в MinIO через S3 сервис
        upload_result = s3_service.upload_file(
            file_content, 
            file.filename, 
            file.content_type
        )
        
        # Сохраняем запись в БД
        db_file = FileModel(
            filename=upload_result["storage_path"].split('/')[-1],  # уникальное имя
            original_filename=file.filename,
            file_size=upload_result["file_size"],
            file_type=file.content_type,
            storage_path=upload_result["storage_path"],
            application_id=application_id,
            user_id=current_user.id
        )
        
        db.add(db_file)
        db.commit()
        db.refresh(db_file)
        
        return FileUploadResponse(
            id=db_file.id,
            filename=file.filename,
            file_size=db_file.file_size,
            created_at=db_file.created_at
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка загрузки файла: {str(e)}")


@router.get("/applications/{application_id}/files", response_model=List[FileResponse])
async def get_application_files(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить список файлов для заявки"""
    
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    
    if application.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Нет прав на просмотр файлов этой заявки")
    
    files = db.query(FileModel).filter(FileModel.application_id == application_id).all()
    
    return files


@router.get("/files/{file_id}")
async def get_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Скачать файл из MinIO через pre-signed URL"""
    
    db_file = db.query(FileModel).filter(FileModel.id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="Файл не найден")
    
    # Проверяем права доступа
    application = db.query(Application).filter(Application.id == db_file.application_id).first()
    if application and application.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Нет прав на скачивание этого файла")
    
    # Получаем pre-signed URL из MinIO
    presigned_url = s3_service.get_presigned_url(db_file.storage_path)
    
    return {
        "id": db_file.id,
        "filename": db_file.original_filename,
        "file_size": db_file.file_size,
        "download_url": presigned_url,
        "created_at": db_file.created_at
    }


@router.delete("/files/{file_id}")
async def delete_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Удалить файл из MinIO и БД"""
    
    db_file = db.query(FileModel).filter(FileModel.id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="Файл не найден")
    
    # Проверяем права доступа
    if db_file.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Нет прав на удаление этого файла")
    
    # Удаляем файл из MinIO
    s3_service.delete_file(db_file.storage_path)
    
    # Удаляем запись из БД
    db.delete(db_file)
    db.commit()
    
    return {"message": "Файл успешно удален"}