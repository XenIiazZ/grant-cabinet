import pytest
from datetime import datetime, timedelta
from jose import jwt
from app.services.token_service import token_service

def test_create_access_token():
    data = {"sub": "test@example.com", "user_id": 1}
    token = token_service.create_access_token(data)
    assert token is not None
    decoded = jwt.decode(token, token_service.SECRET_KEY, algorithms=[token_service.ALGORITHM])
    assert decoded["sub"] == "test@example.com"
    assert decoded["user_id"] == 1
    assert decoded["type"] == "access"
    assert "exp" in decoded

def test_create_refresh_token():
    data = {"sub": "test@example.com", "user_id": 1}
    token = token_service.create_refresh_token(data)
    decoded = jwt.decode(token, token_service.SECRET_KEY, algorithms=[token_service.ALGORITHM])
    assert decoded["type"] == "refresh"

def test_verify_token_valid():
    token = token_service.create_access_token({"sub": "test", "user_id": 1})
    payload = token_service.verify_token(token, "access")
    assert payload is not None
    assert payload["sub"] == "test"

def test_verify_token_wrong_type():
    refresh = token_service.create_refresh_token({"sub": "test", "user_id": 1})
    payload = token_service.verify_token(refresh, "access")
    assert payload is None

def test_verify_token_expired():
    from unittest.mock import patch
    with patch("app.services.token_service.datetime") as mock_datetime:
        mock_datetime.utcnow.return_value = datetime.utcnow() - timedelta(days=1)
        token = token_service.create_access_token({"sub": "test", "user_id": 1})
        payload = token_service.verify_token(token, "access")
        assert payload is None