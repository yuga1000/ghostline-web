# Ghostline Web

Этот репозиторий содержит статические файлы для сайта Ghostline. Сайт может быть размещен на GitHub Pages или Railway.

## 🚀 Быстрое обновление сайта

### Автоматический push (рекомендуется)
```bash
./update-site.sh
```

### Или через терминал
```bash
./auto-push.sh "Ваш комментарий к изменениям"
```

### Двойной клик (macOS)
Просто дважды кликните на файл `quick-push.command` в Finder

## 🔧 Локальный запуск

Установите зависимости и запустите сервер на порту `8080`:

```bash
npm install
npm start
```

## 📡 Развертывание

### GitHub Pages
Сайт автоматически обновляется при push в main ветку:
- 🌐 **Сайт**: https://yuga1000.github.io/ghostline-web/
- 📁 **Репозиторий**: https://github.com/yuga1000/ghostline-web

### Railway
1. Подключите этот репозиторий к Railway
2. Включите развертывания из ветки `main`
3. Railway автоматически запустит `npm start` на порту `8080`

## 📝 Скрипты

- `update-site.sh` - Быстрое обновление с автоматическим коммитом
- `auto-push.sh` - Push с кастомным сообщением
- `quick-push.command` - Двойной клик для macOS

## ⚙️ Настройка Git

Git уже настроен для этого репозитория:
- Email: yuga1000@users.noreply.github.com
- Name: yuga1000
