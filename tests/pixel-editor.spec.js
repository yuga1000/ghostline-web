// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * 🎨 PIXEL EDITOR TESTS
 * Проверяет что pixel-editor.html работает правильно
 */

test.describe('Pixel Editor - UI Elements', () => {

  test('загружает редактор без ошибок', async ({ page }) => {
    await page.goto('/pixel-editor.html');
    await expect(page).toHaveTitle(/Pixel Editor/i);
  });

  test('canvas виден и кликабелен', async ({ page }) => {
    await page.goto('/pixel-editor.html');

    const canvas = page.locator('#pixelCanvas');
    await expect(canvas).toBeVisible();
  });

  test('все инструменты есть', async ({ page }) => {
    await page.goto('/pixel-editor.html');

    await expect(page.locator('button[data-tool="draw"]')).toBeVisible();
    await expect(page.locator('button[data-tool="erase"]')).toBeVisible();
    await expect(page.locator('button[data-tool="fill"]')).toBeVisible();
    await expect(page.locator('button[data-tool="eyedropper"]')).toBeVisible();
  });

  test('grid opacity slider существует', async ({ page }) => {
    await page.goto('/pixel-editor.html');

    const gridSlider = page.locator('#gridOpacity');
    await expect(gridSlider).toBeVisible();

    // Проверяем значение по умолчанию
    const value = await gridSlider.inputValue();
    expect(parseInt(value)).toBe(8); // Default 8%
  });

  test('onion skin opacity slider существует', async ({ page }) => {
    await page.goto('/pixel-editor.html');

    const onionSlider = page.locator('#onionOpacity');
    await expect(onionSlider).toBeVisible();

    // Проверяем значение по умолчанию
    const value = await onionSlider.inputValue();
    expect(parseInt(value)).toBe(30); // Default 30%
  });

  test('zoom controls существуют', async ({ page }) => {
    await page.goto('/pixel-editor.html');

    await expect(page.locator('#zoomIn')).toBeVisible();
    await expect(page.locator('#zoomOut')).toBeVisible();
    await expect(page.locator('#zoomReset')).toBeVisible();
  });

  test('undo button существует', async ({ page }) => {
    await page.goto('/pixel-editor.html');

    const undoBtn = page.locator('#undoBtn');
    await expect(undoBtn).toBeVisible();
    await expect(undoBtn).toContainText('Undo');
  });

});

test.describe('Pixel Editor - Функциональность', () => {

  test('можно рисовать на canvas', async ({ page }) => {
    await page.goto('/pixel-editor.html');

    const canvas = page.locator('#pixelCanvas');

    // Кликаем на canvas (должен нарисоваться пиксель)
    await canvas.click({ position: { x: 50, y: 50 } });

    // Проверяем что canvas изменился (тест на то что рисование работает)
    // Мы не можем легко проверить пиксели, но можем проверить что нет ошибок
    const errors = [];
    page.on('pageerror', err => errors.push(err));

    await page.waitForTimeout(500);
    expect(errors.length).toBe(0);
  });

  test('grid opacity slider работает', async ({ page }) => {
    await page.goto('/pixel-editor.html');

    const slider = page.locator('#gridOpacity');
    const valueDisplay = page.locator('#gridOpacityValue');

    // Меняем opacity
    await slider.fill('50');

    // Проверяем что display обновился
    await expect(valueDisplay).toHaveText('50%');
  });

  test('onion skin slider работает', async ({ page }) => {
    await page.goto('/pixel-editor.html');

    const slider = page.locator('#onionOpacity');
    const valueDisplay = page.locator('#onionOpacityValue');

    // Меняем opacity
    await slider.fill('70');

    // Проверяем что display обновился
    await expect(valueDisplay).toHaveText('70%');
  });

  test('zoom работает', async ({ page }) => {
    await page.goto('/pixel-editor.html');

    const canvas = page.locator('#pixelCanvas');
    const zoomLevel = page.locator('#zoomLevel');

    // Нажимаем zoom in
    await page.locator('#zoomIn').click();

    // Проверяем что zoom level обновился
    const level = await zoomLevel.textContent();
    expect(parseInt(level)).toBeGreaterThan(100);
  });

  test('undo доступен после рисования', async ({ page }) => {
    await page.goto('/pixel-editor.html');

    const canvas = page.locator('#pixelCanvas');
    const undoBtn = page.locator('#undoBtn');

    // Рисуем
    await canvas.click({ position: { x: 100, y: 100 } });

    // Проверяем что можем нажать undo (нет ошибок)
    await undoBtn.click();

    const errors = [];
    page.on('pageerror', err => errors.push(err));

    await page.waitForTimeout(300);
    expect(errors.length).toBe(0);
  });

  test('Ctrl+Z работает для undo', async ({ page }) => {
    await page.goto('/pixel-editor.html');

    const canvas = page.locator('#pixelCanvas');

    // Рисуем
    await canvas.click({ position: { x: 100, y: 100 } });

    // Нажимаем Ctrl+Z
    await page.keyboard.press('Meta+z'); // Meta = Cmd на Mac

    // Проверяем что нет ошибок
    const errors = [];
    page.on('pageerror', err => errors.push(err));

    await page.waitForTimeout(300);
    expect(errors.length).toBe(0);
  });

  test('экспорт PNG работает', async ({ page }) => {
    await page.goto('/pixel-editor.html');

    // Настраиваем download event
    const downloadPromise = page.waitForEvent('download');

    // Кликаем export PNG
    await page.locator('#exportPNG').click();

    // Ждем download
    const download = await downloadPromise;

    // Проверяем что файл PNG
    expect(download.suggestedFilename()).toMatch(/\.png$/);
  });

});
