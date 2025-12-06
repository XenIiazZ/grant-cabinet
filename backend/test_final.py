import requests
import json

BASE = "http://localhost:8000"

print("тест ЛР №5-6")

# 1. Сначала создадим нового пользователя
print("1. Регистрация нового пользователя...")
reg_data = {
    "email": "test_lr6@mtuci.ru",
    "password": "bvt2024",
    "full_name": "Студент БВТ"
}

resp = requests.post(f"{BASE}/api/auth/register", json=reg_data)
print(f"   Статус: {resp.status_code}")
if resp.status_code == 200:
    print(f"   Ответ: {resp.json()}")

# 2. Логин
print("\n2. Логин...")
login_data = {
    "email": "test_lr6@mtuci.ru",
    "password": "bvt2024"
}

resp = requests.post(f"{BASE}/api/auth/login", json=login_data)
print(f"   Статус: {resp.status_code}")
print(f"   Ответ: {resp.text[:100]}...")

if resp.status_code == 200:
    token = resp.json()["access_token"]
    print(f"   Токен получен!")
    
    # 3. Создать грант БЕЗ токена
    print("\n3. Тест защиты API (без токена)...")
    grant_data = {
        "title": "Грант на исследования",
        "description": "Описание проекта",
        "category": "Наука",
        "budget": 500000.0,
        "deadline": "2024-12-31T00:00:00"
    }
    
    resp = requests.post(f"{BASE}/api/grants/", json=grant_data)
    print(f"   Статус: {resp.status_code}")
    print(f"   Ответ: {resp.text}")
    
    # 4. Создать грант С токеном
    print("\n4. Тест с токеном...")
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.post(f"{BASE}/api/grants/", json=grant_data, headers=headers)
    print(f"   Статус: {resp.status_code}")
    if resp.status_code == 200:
        print(f"   Успех! Создан грант: {resp.json()}")
    
    # 5. Получить /me
    print("\n5. Получение данных пользователя...")
    resp = requests.get(f"{BASE}/api/auth/me?token={token}")
    print(f"   Статус: {resp.status_code}")
    if resp.status_code == 200:
        print(f"   Пользователь: {resp.json()}")
    
    # 6. Получить список грантов
    print("\n6. Получение списка грантов...")
    resp = requests.get(f"{BASE}/api/grants/")
    print(f"   Статус: {resp.status_code}")
    grants = resp.json()
    print(f"   Найдено грантов: {len(grants)}")

print("\n=== Тест завершен ===")