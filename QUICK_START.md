# Agent Pet - Быстрый старт

## Шаг 1: Удалить старый файл

```bash
rm /Users/yuga/Desktop/ghostline-web/pet.js
```

## Шаг 2: Очистить кеш браузера

**Chrome/Edge/Firefox:**
- Нажмите `Ctrl+Shift+R` (Windows/Linux)
- Нажмите `Cmd+Shift+R` (Mac)

**Safari:**
- `Cmd+Option+E` (очистить кеш)
- Затем `Cmd+R` (перезагрузить)

## Шаг 3: Открыть stream.html и протестировать

1. Откройте `/Users/yuga/Desktop/ghostline-web/stream.html` в браузере
2. Откройте DevTools Console (F12)
3. Дождитесь логов от WebSocket
4. Проверьте в консоли:
   ```
   [Pet] Initialized - Stage: X, Logs: Y
   ```

## Готово!

Пет теперь:
- ✅ Сохраняет прогресс (localStorage)
- ✅ Реагирует осмысленно на логи (анализ ключевых слов)
- ✅ Не дергается слишком часто (debouncing 3s)
- ✅ Показывает визуальный эффект роста (мигание + танец)

---

## Сбросить прогресс (опционально)

Если нужно начать с нуля, выполните в DevTools Console:
```javascript
localStorage.removeItem('ghostline-pet-state');
location.reload();
```

---

## Настройка (опционально)

### Изменить пороги роста:
Файл: `stream.html`, строки 1288-1293
```javascript
const STAGE_THRESHOLDS = {
    1: 0,    // Stage 1: 0+ logs
    2: 10,   // Stage 2: 10+ logs  ← измените на нужное
    3: 25,   // Stage 3: 25+ logs  ← измените на нужное
    4: 50    // Stage 4: 50+ logs  ← измените на нужное
};
```

### Изменить cooldown между анимациями:
Файл: `stream.html`, строка 1285
```javascript
const ANIMATION_COOLDOWN = 3000; // ← измените (в миллисекундах)
```

---

## Помощь

Если что-то не работает:
1. Проверьте что `pet.js` удален
2. Очистите кеш браузера (hard reload)
3. Откройте DevTools Console и посмотрите ошибки
4. Смотрите полный отчет: `PET_INTEGRATION_REPORT.md`
