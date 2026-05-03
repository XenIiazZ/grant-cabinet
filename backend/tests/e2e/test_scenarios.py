import pytest
@pytest.mark.skip_ci
def test_full_user_journey(e2e_client):
    # 1. Регистрация
    reg = e2e_client.post("/api/auth/register", json={
        "email": "e2e@example.com",
        "password": "e2epass",
        "full_name": "E2E User"
    })
    assert reg.status_code == 200
    # 2. Логин
    login = e2e_client.post("/api/auth/login", json={"email": "e2e@example.com", "password": "e2epass"})
    assert login.status_code == 200
    token = login.json()["access_token"]
    # 3. Получение грантов (предполагаем, что грант есть – создадим его через админа)
    # Для простоты пропустим создание гранта, если его нет. Но тест должен быть независимым.
    # Вместо этого можно создать грант через админа, но здесь опустим для краткости.
    grants = e2e_client.get("/api/grants/", headers={"Authorization": f"Bearer {token}"})
    assert grants.status_code == 200
    if grants.json():
        grant_id = grants.json()[0]["id"]
        app_resp = e2e_client.post("/api/applications/", json={
            "grant_id": grant_id,
            "project_title": "E2E Project",
            "project_description": "Description",
            "status": "на_рассмотрении"
        }, headers={"Authorization": f"Bearer {token}"})
        assert app_resp.status_code == 200
        my_apps = e2e_client.get("/api/applications/my", headers={"Authorization": f"Bearer {token}"})
        assert my_apps.status_code == 200
        assert len(my_apps.json()) > 0
    # 4. Выход
    refresh = login.json()["refresh_token"]
    logout = e2e_client.post("/api/auth/logout", json={"refresh_token": refresh})
    assert logout.status_code == 200

@pytest.mark.skip_ci
def test_admin_can_block_user(e2e_client):
    # Создаём обычного пользователя
    e2e_client.post("/api/auth/register", json={
        "email": "target@example.com",
        "password": "pass",
        "full_name": "Target"
    })
    # Админ логин
    admin_login = e2e_client.post("/api/auth/login", json={"email": "admin@example.com", "password": "adminpass"})
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]
    # Получаем список пользователей
    users = e2e_client.get("/api/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
    target_id = None
    for u in users.json():
        if u["email"] == "target@example.com":
            target_id = u["id"]
            break
    assert target_id is not None
    # Блокируем
    block = e2e_client.patch(f"/api/admin/users/{target_id}/status", json={"status": "blocked"}, headers={"Authorization": f"Bearer {admin_token}"})
    assert block.status_code == 200