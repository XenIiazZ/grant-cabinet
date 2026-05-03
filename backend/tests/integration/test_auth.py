
import pytest
from app.services.token_service import token_service

def test_register_success(client, db):
    response = client.post("/api/auth/register", json={
        "email": "newuser@example.com",
        "password": "secret123",
        "full_name": "New User"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["role"] == "user"

def test_register_duplicate_email(client, test_user):
    response = client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "pass",
        "full_name": "Duplicate"
    })
    assert response.status_code == 400
    assert "already registered" in response.text

def test_login_success(client, test_user):
    response = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "password"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data

def test_login_wrong_password(client, test_user):
    response = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "wrong"
    })
    assert response.status_code == 401

def test_get_me_with_valid_token(client, test_user):
    login_resp = client.post("/api/auth/login", json={"email": "test@example.com", "password": "password"})
    token = login_resp.json()["access_token"]
    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"

@pytest.mark.skip_ci
def test_refresh_token(client, test_user, db):
    login_resp = client.post("/api/auth/login", json={"email": "test@example.com", "password": "password"})
    assert login_resp.status_code == 200
    refresh = login_resp.json()["refresh_token"]
    
    # Принудительно сохраняем refresh token в БД (сессия client использует тот же db)
    db.commit()
    
    # Проверяем, что запись появилась
    from app.database.models.token import RefreshToken
    token_record = db.query(RefreshToken).filter(RefreshToken.token == refresh).first()
    assert token_record is not None, "Refresh token not saved in DB"
    
    response = client.post("/api/auth/refresh", json={"refresh_token": refresh})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["access_token"] != login_resp.json()["access_token"]