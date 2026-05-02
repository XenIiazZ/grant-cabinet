import { test, expect } from '@playwright/test';

test('user can register and login', async ({ page }) => {
  test.setTimeout(60000);
  
  await page.goto('/register');
  await page.waitForSelector('button:has-text("Зарегистрироваться")', { timeout: 15000 });
  
  await page.fill('input[name="fullName"]', 'E2E User');
  await page.fill('input[name="email"]', 'e2e@example.com');
  await page.fill('input[name="password"]', 'e2epass');
  await page.fill('input[name="confirmPassword"]', 'e2epass');
  
  await page.click('button:has-text("Зарегистрироваться")');
  
  // Ждём перенаправления на /login (с запасом)
  await expect(page).toHaveURL(/login/, { timeout: 10000 });
  
  await page.fill('input[name="email"]', 'e2e@example.com');
  await page.fill('input[name="password"]', 'e2epass');
  await page.click('button:has-text("Войти")');
  
  await expect(page).toHaveURL(/\//, { timeout: 10000 });
});

test('admin can block a user', async ({ page }) => {
  test.setTimeout(60000);
  
  // Регистрируем обычного пользователя
  await page.goto('/register');
  await page.waitForSelector('button:has-text("Зарегистрироваться")', { timeout: 15000 });
  await page.fill('input[name="fullName"]', 'Target User');
  await page.fill('input[name="email"]', 'target@example.com');
  await page.fill('input[name="password"]', 'targetpass');
  await page.fill('input[name="confirmPassword"]', 'targetpass');
  await page.click('button:has-text("Зарегистрироваться")');
  await expect(page).toHaveURL(/login/, { timeout: 10000 });
  
  // Логин администратора
  await page.fill('input[name="email"]', 'admin@grantcabinet.ru');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button:has-text("Войти")');
  await expect(page).toHaveURL(/admin/, { timeout: 10000 });
  
  await page.click('button:has-text("Пользователи")');
  await page.waitForSelector('table', { timeout: 10000 });
  
  const row = page.locator('tr', { hasText: 'target@example.com' });
  await row.locator('button:has-text("Заблокировать")').click();
  await expect(row.locator('td:has-text("Заблокирован")')).toBeVisible({ timeout: 10000 });
});