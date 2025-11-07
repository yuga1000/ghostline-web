// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * 🔍 GHOSTLINE STREAM PAGE TESTS
 * Проверяет что stream.html работает правильно
 */

test.describe('Stream Page - Логи и Pet', () => {

  test('загружает страницу без ошибок', async ({ page }) => {
    await page.goto('/stream.html');
    await expect(page).toHaveTitle(/Ghostline/i);
  });

  test('terminal виден на странице', async ({ page }) => {
    await page.goto('/stream.html');

    const terminal = page.locator('.agent-terminal');
    await expect(terminal).toBeVisible();
  });

  test('pet container существует', async ({ page }) => {
    await page.goto('/stream.html');

    const pet = page.locator('#agent-pet');
    await expect(pet).toBeVisible();
  });

  test('countdown container существует', async ({ page }) => {
    await page.goto('/stream.html');

    const countdown = page.locator('#rest-countdown-container');
    // Countdown может быть hidden, но должен существовать
    await expect(countdown).toBeAttached();
  });

  test('rain container существует', async ({ page }) => {
    await page.goto('/stream.html');

    const rain = page.locator('#rain-container');
    await expect(rain).toBeAttached();
  });

  test('spider web system подключен', async ({ page }) => {
    await page.goto('/stream.html');

    // Check if spider-web-system.js is loaded
    const scripts = await page.locator('script[src*="spider-web"]').count();
    expect(scripts).toBeGreaterThan(0);
  });

});

test.describe('Stream Page - Mobile', () => {

  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE размер

  test('terminal виден на мобилке', async ({ page }) => {
    await page.goto('/stream.html');

    const terminal = page.locator('.agent-terminal');
    await expect(terminal).toBeVisible();

    // Проверяем что terminal имеет правильную высоту
    const box = await terminal.boundingBox();
    expect(box.height).toBeGreaterThan(150); // Минимум 150px
    expect(box.height).toBeLessThan(250); // Максимум 250px
  });

  test('pet виден на мобилке', async ({ page }) => {
    await page.goto('/stream.html');

    const pet = page.locator('#agent-pet');
    await expect(pet).toBeVisible();
  });

});

test.describe('Stream Page - Функциональность', () => {

  test('loadExistingLogs функция вызывается', async ({ page }) => {
    // Intercept fetch to /api/logs
    let logsFetched = false;

    await page.route('**/api/logs', route => {
      logsFetched = true;
      route.fulfill({
        status: 200,
        body: JSON.stringify({ logs: [] })
      });
    });

    await page.goto('/stream.html');

    // Wait a bit for loadExistingLogs to be called
    await page.waitForTimeout(1000);

    expect(logsFetched).toBe(true);
  });

  test('WebSocket пытается подключиться', async ({ page }) => {
    let wsAttempted = false;

    page.on('websocket', ws => {
      wsAttempted = true;
    });

    await page.goto('/stream.html');
    await page.waitForTimeout(2000);

    // WebSocket может не подключиться (это ок), но должна быть попытка
    // Проверим через console log
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));

    await page.waitForTimeout(1000);

    const wsLogs = logs.some(log => log.includes('WebSocket') || log.includes('ws://'));
    expect(wsLogs).toBe(true);
  });

});
