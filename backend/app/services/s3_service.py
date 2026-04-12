import boto3
from botocore.exceptions import ClientError
import os
from datetime import datetime, timedelta
from typing import Optional
import uuid

from app.core.config import settings

class S3Service:
    def __init__(self):
        self.bucket_name = settings.S3_BUCKET_NAME
        self.endpoint_url = settings.S3_ENDPOINT_URL
        self.access_key = settings.S3_ACCESS_KEY
        self.secret_key = settings.S3_SECRET_KEY
        self.use_ssl = settings.S3_USE_SSL
        
        self.client = boto3.client(
            's3',
            endpoint_url=self.endpoint_url,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            use_ssl=self.use_ssl,
            verify=False
        )
        
        self._ensure_bucket()
    
    def _ensure_bucket(self):
        """Проверить существование bucket и создать при необходимости"""
        try:
            self.client.head_bucket(Bucket=self.bucket_name)
            print(f"Bucket '{self.bucket_name}' уже существует")
        except ClientError:
            self.client.create_bucket(Bucket=self.bucket_name)
            print(f"Bucket '{self.bucket_name}' создан")
    
    def upload_file(self, file_content: bytes, original_filename: str, content_type: str) -> dict:
        """Загрузить файл в MinIO"""
        # Генерируем уникальное имя файла
        extension = original_filename.split('.')[-1] if '.' in original_filename else ''
        unique_filename = f"{uuid.uuid4()}.{extension}" if extension else str(uuid.uuid4())
        
        # Полный путь в хранилище
        storage_path = f"uploads/{datetime.utcnow().strftime('%Y/%m/%d')}/{unique_filename}"
        
        try:
            self.client.put_object(
                Bucket=self.bucket_name,
                Key=storage_path,
                Body=file_content,
                ContentType=content_type,
                Metadata={
                    'original-filename': original_filename
                }
            )
            print(f"Файл загружен в MinIO: {storage_path}")
            
            return {
                "storage_path": storage_path,
                "file_size": len(file_content)
            }
        except ClientError as e:
            raise Exception(f"Ошибка загрузки в MinIO: {e}")
    
    def get_presigned_url(self, storage_path: str, expires_in: int = 3600) -> str:
        """Получить pre-signed URL для скачивания файла"""
        try:
            url = self.client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': storage_path
                },
                ExpiresIn=expires_in
            )
            return url
        except ClientError as e:
            raise Exception(f"Ошибка получения URL: {e}")
    
    def delete_file(self, storage_path: str) -> bool:
        """Удалить файл из MinIO"""
        try:
            self.client.delete_object(
                Bucket=self.bucket_name,
                Key=storage_path
            )
            print(f"Файл удален из MinIO: {storage_path}")
            return True
        except ClientError as e:
            print(f"Ошибка удаления из MinIO: {e}")
            return False

s3_service = S3Service()