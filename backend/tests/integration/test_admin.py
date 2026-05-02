def test_admin_get_users(client, test_admin):
    login = client.post("/api/auth/login", json={"email": "admin@example.com", "password": "adminpass"})
    token = login.json()["access_token"]
    response = client.get("/api/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    users = response.json()
    assert isinstance(users, list)
    assert len(users) >= 1

def test_admin_get_users_forbidden_for_user(client, test_user):
    login = client.post("/api/auth/login", json={"email": "test@example.com", "password": "password"})
    token = login.json()["access_token"]
    response = client.get("/api/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403

def test_admin_toggle_user_status(client, test_admin, test_user):
    login = client.post("/api/auth/login", json={"email": "admin@example.com", "password": "adminpass"})
    token = login.json()["access_token"]
    # заблокировать
    response = client.patch(f"/api/admin/users/{test_user.id}/status", json={"status": "blocked"}, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    # проверить, что is_active стал False
    get_user = client.get("/api/admin/users", headers={"Authorization": f"Bearer {token}"})
    for u in get_user.json():
        if u["id"] == test_user.id:
            assert u["is_active"] == False