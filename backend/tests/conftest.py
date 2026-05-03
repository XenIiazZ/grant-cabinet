# backend/tests/conftest.py
import sys
from unittest.mock import MagicMock

# === МОК S3 (должен быть ДО любого импорта app) ===
mock_s3 = MagicMock()
mock_s3.get_presigned_url.return_value = "https://mock.url"
mock_s3.upload_file.return_value = {"storage_path": "mock/path", "file_size": 0}
mock_s3.delete_file.return_value = True
sys.modules['app.services.s3_service'] = MagicMock(s3_service=mock_s3)

# Теперь можно импортировать остальное
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import app
from app.database.base import Base
from app.database.session import get_db
from app.database.models.user import User, UserRole
import hashlib

# Тестовая БД SQLite in-memory
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

@pytest.fixture(scope="function", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db):
    def _get_test_db():
        try:
            yield db
        finally:
            pass
    app.dependency_overrides[get_db] = _get_test_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.pop(get_db, None)

@pytest.fixture
def test_user(db):
    user = User(
        email="test@example.com",
        hashed_password=hash_password("password"),
        full_name="Test User",
        role=UserRole.USER,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture
def test_admin(db):
    admin = User(
        email="admin@example.com",
        hashed_password=hash_password("adminpass"),
        full_name="Admin User",
        role=UserRole.ADMIN,
        is_active=True
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin

@pytest.fixture
def test_grant(db, test_user):
    from app.database.models.grant import Grant, GrantCategory, GrantStatus
    grant = Grant(
        title="Test Grant",
        description="Test Description",
        max_amount="100000",
        category=GrantCategory.EDUCATION,
        status=GrantStatus.OPEN,
        created_by=test_user.id
    )
    db.add(grant)
    db.commit()
    db.refresh(grant)
    return grant

@pytest.fixture
def test_application(db, test_user, test_grant):
    from app.database.models.application import Application, ApplicationStatus
    app_obj = Application(
        grant_id=test_grant.id,
        user_id=test_user.id,
        project_title="Test Project",
        project_description="Test Description",
        status=ApplicationStatus.PENDING
    )
    db.add(app_obj)
    db.commit()
    db.refresh(app_obj)
    return app_obj

# Фикстура для E2E-клиента (опционально)
@pytest.fixture(scope="function")
def e2e_client():
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as test_client:
        yield test_client
    Base.metadata.drop_all(bind=engine)