def test_create_application_success(client, test_user, test_grant):
    login = client.post("/api/auth/login", json={"email": "test@example.com", "password": "password"})
    token = login.json()["access_token"]
    response = client.post("/api/applications/", json={
        "grant_id": test_grant.id,
        "project_title": "My Project",
        "project_description": "Description",
        "status": "на_рассмотрении"
    }, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["project_title"] == "My Project"
    assert data["user_id"] == test_user.id

def test_create_application_closed_grant(client, test_user, test_grant, db):
    from app.database.models.grant import GrantStatus
    test_grant.status = GrantStatus.CLOSED
    db.commit()
    login = client.post("/api/auth/login", json={"email": "test@example.com", "password": "password"})
    token = login.json()["access_token"]
    response = client.post("/api/applications/", json={
        "grant_id": test_grant.id,
        "project_title": "Project",
        "project_description": "Desc"
    }, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 400
    assert "закрыт" in response.text

def test_get_my_applications(client, test_user, test_application):
    login = client.post("/api/auth/login", json={"email": "test@example.com", "password": "password"})
    token = login.json()["access_token"]
    response = client.get("/api/applications/my", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    apps = response.json()
    assert len(apps) >= 1
    assert apps[0]["id"] == test_application.id