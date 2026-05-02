def test_get_grants_public(client, test_grant):
    response = client.get("/api/grants/")
    assert response.status_code == 200
    items = response.json()
    assert isinstance(items, list)
    assert len(items) >= 1
    assert items[0]["title"] == "Test Grant"

def test_get_grant_by_id(client, test_grant):
    response = client.get(f"/api/grants/{test_grant.id}")
    assert response.status_code == 200
    assert response.json()["id"] == test_grant.id

def test_get_grant_not_found(client):
    response = client.get("/api/grants/9999")
    assert response.status_code == 404

def test_create_grant_admin(client, test_admin):
    login = client.post("/api/auth/login", json={"email": "admin@example.com", "password": "adminpass"})
    token = login.json()["access_token"]
    response = client.post("/api/grants/", json={
        "title": "New Grant",
        "description": "Desc",
        "max_amount": "200000",
        "category": "Наука",
        "status": "открыт"
    }, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["title"] == "New Grant"

def test_create_grant_forbidden_for_user(client, test_user):
    login = client.post("/api/auth/login", json={"email": "test@example.com", "password": "password"})
    token = login.json()["access_token"]
    response = client.post("/api/grants/", json={
        "title": "Should not create",
        "description": "Desc",
        "max_amount": "1000"
    }, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403