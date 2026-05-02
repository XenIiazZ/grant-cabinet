# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> admin can block a user
- Location: e2e\auth.spec.ts:26:5

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /admin/
Received string:  "http://localhost:3000/login"
Timeout: 10000ms

Call log:
  - Expect "toHaveURL" with timeout 10000ms
    13 × unexpected value "http://localhost:3000/login"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e6]:
      - button "Грантовый кабинет" [ref=e8]:
        - img [ref=e10]
        - generic [ref=e13]: Грантовый кабинет
      - button "Войти" [active] [ref=e15]
  - main [ref=e16]:
    - generic [ref=e18]:
      - generic [ref=e19]:
        - heading "Вход в систему" [level=2] [ref=e20]
        - paragraph [ref=e21]:
          - text: Или
          - button "зарегистрируйтесь" [ref=e22]
      - generic [ref=e23]:
        - generic [ref=e24]:
          - heading "Грантовый кабинет" [level=4] [ref=e25]
          - paragraph [ref=e26]: Войдите в систему для управления заявками на гранты
        - generic [ref=e27]:
          - generic [ref=e28]:
            - generic [ref=e29]:
              - generic [ref=e30]: Email адрес
              - textbox "Email адрес" [ref=e31]:
                - /placeholder: example@mail.ru
                - text: admin@grantcabinet.ru
            - generic [ref=e32]:
              - generic [ref=e33]: Пароль
              - textbox "Пароль" [ref=e34]:
                - /placeholder: Введите пароль
                - text: admin123
            - button "Забыли пароль?" [ref=e37]
            - button "Войти" [ref=e38]
          - alert [ref=e39]:
            - img [ref=e40]
            - generic [ref=e42]:
              - strong [ref=e43]: "Для тестирования:"
              - text: "Админ:"
              - code [ref=e44]: admin@grantcabinet.ru
              - text: "Пользователь: любой другой email"
      - paragraph [ref=e46]:
        - text: Нет аккаунта?
        - button "Зарегистрироваться" [ref=e47]
  - contentinfo [ref=e48]:
    - generic [ref=e49]:
      - generic [ref=e50]:
        - generic [ref=e51]:
          - heading "О платформе" [level=3] [ref=e52]
          - paragraph [ref=e53]: Грантовый кабинет — платформа для подачи заявок на получение грантов и отслеживания их статуса.
        - generic [ref=e54]:
          - heading "Поддержка" [level=3] [ref=e55]
          - list [ref=e56]:
            - listitem [ref=e57]:
              - link "Часто задаваемые вопросы" [ref=e58] [cursor=pointer]:
                - /url: "#"
            - listitem [ref=e59]:
              - link "Инструкции по подаче заявок" [ref=e60] [cursor=pointer]:
                - /url: "#"
            - listitem [ref=e61]:
              - link "Техническая поддержка" [ref=e62] [cursor=pointer]:
                - /url: "#"
        - generic [ref=e63]:
          - heading "Контакты" [level=3] [ref=e64]
          - list [ref=e65]:
            - listitem [ref=e66]: "Email: support@grants.ru"
            - listitem [ref=e67]: "Телефон: +7 (495) 123-45-67"
            - listitem [ref=e68]: "Адрес: г. Москва, ул. Грантовая, 1"
      - generic [ref=e69]:
        - paragraph [ref=e70]: © 2025 Грантовый кабинет. Все права защищены.
        - generic [ref=e71]:
          - link "Политика конфиденциальности" [ref=e72] [cursor=pointer]:
            - /url: "#"
          - link "Пользовательское соглашение" [ref=e73] [cursor=pointer]:
            - /url: "#"
  - region "Notifications alt+T"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('user can register and login', async ({ page }) => {
  4  |   test.setTimeout(60000);
  5  |   
  6  |   await page.goto('/register');
  7  |   await page.waitForSelector('button:has-text("Зарегистрироваться")', { timeout: 15000 });
  8  |   
  9  |   await page.fill('input[name="fullName"]', 'E2E User');
  10 |   await page.fill('input[name="email"]', 'e2e@example.com');
  11 |   await page.fill('input[name="password"]', 'e2epass');
  12 |   await page.fill('input[name="confirmPassword"]', 'e2epass');
  13 |   
  14 |   await page.click('button:has-text("Зарегистрироваться")');
  15 |   
  16 |   // Ждём перенаправления на /login (с запасом)
  17 |   await expect(page).toHaveURL(/login/, { timeout: 10000 });
  18 |   
  19 |   await page.fill('input[name="email"]', 'e2e@example.com');
  20 |   await page.fill('input[name="password"]', 'e2epass');
  21 |   await page.click('button:has-text("Войти")');
  22 |   
  23 |   await expect(page).toHaveURL(/\//, { timeout: 10000 });
  24 | });
  25 | 
  26 | test('admin can block a user', async ({ page }) => {
  27 |   test.setTimeout(60000);
  28 |   
  29 |   // Регистрируем обычного пользователя
  30 |   await page.goto('/register');
  31 |   await page.waitForSelector('button:has-text("Зарегистрироваться")', { timeout: 15000 });
  32 |   await page.fill('input[name="fullName"]', 'Target User');
  33 |   await page.fill('input[name="email"]', 'target@example.com');
  34 |   await page.fill('input[name="password"]', 'targetpass');
  35 |   await page.fill('input[name="confirmPassword"]', 'targetpass');
  36 |   await page.click('button:has-text("Зарегистрироваться")');
  37 |   await expect(page).toHaveURL(/login/, { timeout: 10000 });
  38 |   
  39 |   // Логин администратора
  40 |   await page.fill('input[name="email"]', 'admin@grantcabinet.ru');
  41 |   await page.fill('input[name="password"]', 'admin123');
  42 |   await page.click('button:has-text("Войти")');
> 43 |   await expect(page).toHaveURL(/admin/, { timeout: 10000 });
     |                      ^ Error: expect(page).toHaveURL(expected) failed
  44 |   
  45 |   await page.click('button:has-text("Пользователи")');
  46 |   await page.waitForSelector('table', { timeout: 10000 });
  47 |   
  48 |   const row = page.locator('tr', { hasText: 'target@example.com' });
  49 |   await row.locator('button:has-text("Заблокировать")').click();
  50 |   await expect(row.locator('td:has-text("Заблокирован")')).toBeVisible({ timeout: 10000 });
  51 | });
```