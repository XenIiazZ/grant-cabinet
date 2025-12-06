import requests
import json
import time

BASE_URL = "http://localhost:8000"

def print_section(title):
    print(f"\n{'='*60}")
    print(f" {title}")
    print(f"{'='*60}")

def test_ml_module():
    print_section("ТЕСТИРОВАНИЕ ML МОДУЛЯ ДЛЯ ОЦЕНКИ ГРАНТОВ")
    
    # 1. Сначала получим токен
    print("1. Получение токена...")
    login_data = {
        "email": "test_lr6@bmstu.ru",
        "password": "bvt2024"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
        if response.status_code != 200:
            print(f"   Ошибка логина: {response.status_code}")
            print(f"   Попробуем зарегистрировать нового пользователя...")
            
            # Регистрация нового пользователя
            reg_data = {
                "email": "ml_test@bmstu.ru",
                "password": "mltest123",
                "full_name": "ML Тест Пользователь"
            }
            response = requests.post(f"{BASE_URL}/api/auth/register", json=reg_data)
            print(f"   Регистрация: {response.status_code}")
            
            # Логин с новым пользователем
            response = requests.post(f"{BASE_URL}/api/auth/login", json=reg_data)
        
        token = response.json()["access_token"]
        print(f"   ✓ Токен получен: {token[:30]}...")
    except Exception as e:
        print(f"   ✗ Ошибка получения токена: {e}")
        return
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # 2. Получить информацию о модели
    print_section("2. Информация о ML модели")
    try:
        response = requests.get(f"{BASE_URL}/api/ai/model-info")
        print(f"   Статус: {response.status_code}")
        if response.status_code == 200:
            model_info = response.json()
            print(f"   Модель: {model_info.get('model_name')}")
            print(f"   Язык: {model_info.get('language')}")
            print(f"   Критериев: {len(model_info.get('criteria', []))}")
            for crit in model_info.get('criteria', []):
                print(f"     - {crit['name']}: {crit['description'][:50]}...")
    except Exception as e:
        print(f"   ✗ Ошибка: {e}")
    
    # 3. Тестовые тексты для оценки
    test_texts = [
        {
            "title": "ХОРОШАЯ заявка (полная)",
            "text": """Наш проект направлен на разработку инновационной системы анализа медицинских данных с использованием методов машинного обучения. Основная цель проекта - создание алгоритма для ранней диагностики заболеваний на основе анализа медицинских изображений. 

Конкретные задачи:
1. Сбор и аннотирование датасета медицинских изображений
2. Разработка архитектуры нейронной сети для классификации
3. Обучение модели на размеченных данных
4. Валидация результатов на тестовой выборке
5. Создание прототипа веб-интерфейса для врачей

Бюджет проекта составляет 1 200 000 рублей. Из них:
- Оборудование (GPU сервер): 500 000 руб.
- Оплата труда разработчиков: 400 000 руб.
- Закупка датасетов: 200 000 руб.
- Конференции и публикации: 100 000 руб.

Срок реализации проекта: 12 месяцев, разделенных на 4 квартала:
1 квартал: Подготовка данных и проектирование
2 квартал: Разработка алгоритмов
3 квартал: Тестирование и валидация
4 квартал: Внедрение и документация

Проект имеет высокую социальную значимость, так как поможет врачам в ранней диагностике серьезных заболеваний, что может спасти жизни пациентов. Система будет особенно полезна в регионах с нехваткой квалифицированных специалистов."""
        },
        {
            "title": "СРЕДНЯЯ заявка (некоторые критерии пропущены)",
            "text": """Проект по созданию мобильного приложения для студентов. Хотим сделать удобное приложение с расписанием и уведомлениями. Бюджет около 300 тысяч рублей. Сделаем за 4 месяца. Будет полезно студентам."""
        },
        {
            "title": "ПЛОХАЯ заявка (слишком короткая)",
            "text": """Хочу сделать проект. Нужны деньги. Примерно 100 тысяч. Быстро сделаю."""
        },
        {
            "title": "Заявка БЕЗ бюджета",
            "text": """Наш научный проект посвящен изучению новых материалов для солнечных батарей. Цель - повысить эффективность преобразования солнечной энергии. Задачи включают синтез материалов, их характеристику и тестирование. Проект будет выполняться в течение 18 месяцев силами исследовательской группы из 5 человек. Социальная значимость заключается в развитии возобновляемой энергетики и снижении зависимости от ископаемого топлива."""
        },
        {
            "title": "Заявка БЕЗ сроков",
            "text": """Разработка образовательной платформы для школьников с использованием геймификации. Цель проекта - сделать обучение более увлекательным и эффективным. Бюджет проекта: 800 000 рублей на разработку контента и платформы. Проект будет полезен для улучшения качества образования и повышения мотивации учащихся."""
        }
    ]
    
    # 4. Тестирование каждой заявки
    print_section("3. ТЕСТИРОВАНИЕ РАЗНЫХ ЗАЯВОК")
    
    for i, test in enumerate(test_texts, 1):
        print(f"\n{i}. {test['title']}")
        print(f"   Текст: {test['text'][:100]}...")
        
        evaluation_data = {
            "application_text": test["text"],
            "grant_title": test["title"],
            "grant_category": "research"
        }
        
        try:
            start_time = time.time()
            response = requests.post(
                f"{BASE_URL}/api/ai/evaluate",
                json=evaluation_data,
                headers=headers
            )
            elapsed = time.time() - start_time
            
            if response.status_code == 200:
                result = response.json()
                print(f"   ✓ Успешно ({elapsed:.2f} сек)")
                print(f"   Общая оценка: {result['overall_score']:.2%} - {result['overall_label']}")
                print(f"   Слов в тексте: {result['word_count']}")
                
                # Выводим оценки по критериям
                print(f"   Критерии:")
                for crit in result["criteria_evaluations"]:
                    status_symbol = "✓" if crit["label"] == "Соответствует" else "⚠" if crit["label"] == "Требует внимания" else "✗"
                    print(f"     {status_symbol} {crit['criterion_name']}: {crit['label']} ({crit['score']:.0%})")
                    print(f"       {crit['explanation']}")
                
                if result["priority_recommendations"]:
                    print(f"   Рекомендации:")
                    for rec in result["priority_recommendations"]:
                        print(f"     • {rec}")
                
            else:
                print(f"   ✗ Ошибка {response.status_code}: {response.text}")
                
        except Exception as e:
            print(f"   ✗ Исключение: {e}")
    
    # 5. Быстрая оценка
    print_section("4. БЫСТРАЯ ОЦЕНКА (quick-evaluate)")
    
    quick_text = "Проект по озеленению города. Бюджет 500 тыс. рублей. Срок 6 месяцев. Будем садить деревья."
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/ai/quick-evaluate?application_text={requests.utils.quote(quick_text)}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"   Текст: {quick_text}")
            print(f"   Общая оценка: {result['overall_score']:.2%} ({result['overall_label']})")
            print(f"   Кол-во слов: {result['word_count']}")
            print(f"   Главная рекомендация: {result['top_recommendation']}")
            print(f"   Критерии:")
            for crit in result["criteria_summary"]:
                print(f"     - {crit['criterion']}: {crit['status']} ({crit['score']})")
        else:
            print(f"   ✗ Ошибка: {response.status_code}")
    except Exception as e:
        print(f"   ✗ Исключение: {e}")
    
    # # 6. Получить список критериев
    # print_section("5. СПИСОК КРИТЕРИЕВ ОЦЕНКИ")
    
    # try:
    #     response = requests.get(f"{BASE_URL}/api/ai/criteria")
    #     if response.status_code == 200:
    #         criteria = response.json()
    #         print(f"   Всего критериев: {len(criteria)}")
    #         for crit in criteria:
    #             print(f"   • {crit['name']}")
    #             print(f"     {crit['description']}")
    #             if 'keywords' in crit:
    #                 print(f"     Ключевые слова: {', '.join(crit['keywords'][:3])}...")
    #             if 'threshold' in crit:
    #                 print(f"     Порог: {crit['threshold']}")
    #             print()
    #     else:
    #         print(f"   ✗ Ошибка: {response.status_code}")
    # except Exception as e:
    #     print(f"   ✗ Исключение: {e}")
    
    # 7. Проверка защиты API (без токена)
    print_section("6. ПРОВЕРКА ЗАЩИТЫ API")
    
    try:
        # Попытка без токена
        response = requests.post(
            f"{BASE_URL}/api/ai/evaluate",
            json={"application_text": "Тест без токена"}
        )
        print(f"   Без токена: {response.status_code} ({'Защищено ✓' if response.status_code in [401, 403] else 'Ошибка защиты ✗'})")
        
        # С неправильным токеном
        bad_headers = {"Authorization": "Bearer wrong_token_123"}
        response = requests.post(
            f"{BASE_URL}/api/ai/evaluate",
            json={"application_text": "Тест с неправильным токеном"},
            headers=bad_headers
        )
        print(f"   С неправильным токеном: {response.status_code} ({'Защищено ✓' if response.status_code in [401, 403] else 'Ошибка защиты ✗'})")
        
    except Exception as e:
        print(f"   ✗ Исключение: {e}")
    
    print_section("ТЕСТИРОВАНИЕ ЗАВЕРШЕНО")
    print("\nРезюме:")
    print("-" * 40)
    print("ML модуль должен оценивать гранты по 5 критериям:")
    print("1. Объем заявки (мин. 100 слов)")
    print("2. Описание проекта (цели, задачи)")
    print("3. Бюджетное обоснование")
    print("4. Сроки реализации")  
    print("5. Социальная значимость")
    

if __name__ == "__main__":
    # Проверяем, запущен ли сервер
    try:
        response = requests.get(f"{BASE_URL}/", timeout=2)
        print(f"Сервер доступен: {response.status_code}")
    except:
        print("ВНИМАНИЕ: Сервер не запущен!")
        print("Запустите в другом терминале: uvicorn main:app --reload")
        print("Продолжить тестирование? (сервер может быть на другом порту)")
        input("Нажмите Enter для продолжения...")
    
    test_ml_module()