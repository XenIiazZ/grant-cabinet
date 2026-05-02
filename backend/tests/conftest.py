import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import app
from app.database.base import Base
from app.database.session import get_db
from app.database.models.user import User, UserRole
import hashlib

# Тестовая БД – in-memory
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

# Автоматическое создание таблиц для всех тестов, кроме e2e (там явно)
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

@pytest.fixture(scope="function")
def e2e_client():
    """Клиент для E2E-тестов с явным созданием таблиц"""
    Base.metadata.create_all(bind=engine)   # <-- КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ
    with TestClient(app) as test_client:
        yield test_client
    Base.metadata.drop_all(bind=engine)

# Мок S3 для всех тестов
@pytest.fixture(autouse=True)
def mock_s3(monkeypatch):
    class MockS3:
        def upload_file(self, file_content, original_filename, content_type):
            return {"storage_path": "mock/path", "file_size": len(file_content)}
        def get_presigned_url(self, storage_path, expires_in=3600):
            return "https://mock.url"
        def delete_file(self, storage_path):
            return True
    monkeypatch.setattr("app.services.s3_service.s3_service", MockS3())

# Фикстура для тестового файла
# @pytest.fixture
# def test_file(db, test_user, test_application):
#     from app.database.models.file import File
#     file = File(
#         filename="test.pdf",
#         original_filename="test.pdf",
#         file_size=1024,
#         file_type="application/pdf",
#         storage_path="test/path",
#         application_id=test_application.id,
#         user_id=test_user.id
#     )
#     db.add(file)
#     db.commit()
#     db.refresh(file)
#     return file


@pytest.fixture(autouse=True)
def mock_s3(monkeypatch):
    class MockS3:
        def __init__(self):
            self.bucket_name = "test-bucket"
        def _ensure_bucket(self):
            pass
        def upload_file(self, file_content, original_filename, content_type):
            return {"storage_path": "mock/path", "file_size": len(file_content)}
        def get_presigned_url(self, storage_path, expires_in=3600):
            return "https://mock.url"
        def delete_file(self, storage_path):
            return True
    monkeypatch.setattr("app.services.s3_service.s3_service", MockS3())