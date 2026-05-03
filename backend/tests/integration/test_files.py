import io
from unittest.mock import patch
def test_upload_file_success(client, test_user, test_application):
    # Мокаем S3 на уровне модуля files (чтобы подхватилось)
    with patch("app.api.endpoints.files.s3_service") as mock_s3:
        mock_s3.upload_file.return_value = {"storage_path": "mock/path", "file_size": 100}
        login = client.post("/api/auth/login", json={"email": "test@example.com", "password": "password"})
        token = login.json()["access_token"]
        file_content = b"test pdf content"
        files = {"file": ("test.pdf", io.BytesIO(file_content), "application/pdf")}
        response = client.post(
            f"/api/applications/{test_application.id}/files",
            files=files,
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["filename"] == "test.pdf"
    
def test_upload_file_too_large(client, test_user, test_application):
    login = client.post("/api/auth/login", json={"email": "test@example.com", "password": "password"})
    token = login.json()["access_token"]
    large_content = b"x" * (11 * 1024 * 1024)  # 11 MB
    files = {"file": ("large.pdf", io.BytesIO(large_content), "application/pdf")}
    response = client.post(f"/api/applications/{test_application.id}/files", files=files, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 400
    assert "слишком большой" in response.text

def test_get_application_files(client, test_user, test_application):
    login = client.post("/api/auth/login", json={"email": "test@example.com", "password": "password"})
    token = login.json()["access_token"]
    response = client.get(f"/api/applications/{test_application.id}/files", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    files = response.json()
    assert isinstance(files, list)   # просто проверяем, что это список
