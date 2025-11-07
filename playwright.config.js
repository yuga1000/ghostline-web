// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright конфигурация для Ghostline тестов
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',

  // Таймаут для каждого теста
  timeout: 30 * 1000,

  expect: {
    timeout: 5000
  },

  // Запускать тесты параллельно
  fullyParallel: true,

  // Fail build on CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,

  // Retry failed tests
  retries: process.env.CI ? 2 : 0,

  // Parallel workers
  workers: process.env.CI ? 1 : undefined,

  // Reporter
  reporter: [
    ['html'],
    ['list']
  ],

  // Shared settings for all tests
  use: {
    // Base URL для всех тестов
    baseURL: 'http://localhost:8080',

    // Скриншоты при ошибках
    screenshot: 'only-on-failure',

    // Видео при ошибках
    video: 'retain-on-failure',

    // Trace on first retry
    trace: 'on-first-retry',
  },

  // Конфигурация для разных устройств
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'mobile',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Запуск локального сервера перед тестами
  webServer: {
    command: 'node server.js',
    url: 'http://localhost:8080',
    reuseExistingServer: true, // Переиспользуем существующий сервер!
    timeout: 120 * 1000,
  },
});
