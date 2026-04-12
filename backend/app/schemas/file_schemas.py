from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class FileBase(BaseModel):
    filename: str
    original_filename: str
    file_size: int
    file_type: str

class FileCreate(FileBase):
    storage_path: str
    application_id: int
    user_id: int

class FileResponse(FileBase):
    id: int
    application_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class FileUploadResponse(BaseModel):
    id: int
    filename: str
    file_size: int
    created_at: datetime
    