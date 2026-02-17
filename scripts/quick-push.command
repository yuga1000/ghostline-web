#!/bin/bash

# Быстрый push для macOS - двойной клик для запуска
cd "$(dirname "$0")"

echo "🚀 Быстрый push ghostline-web на GitHub..."
echo ""

# Проверяем изменения
if [ -z "$(git status --porcelain)" ]; then
    echo "Нет изменений для отправки."
    read -p "Нажмите Enter для закрытия..."
    exit 0
fi

# Показываем что изменилось
echo "Изменения:"
git status --short
echo ""

# Автоматический коммит и push
COMMIT_MSG="Website update $(date '+%Y-%m-%d %H:%M:%S')"
echo "Коммит: $COMMIT_MSG"
echo ""

git add .
git commit -m "$COMMIT_MSG"
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Успешно отправлено на GitHub!"
    echo "🌐 Сайт: https://yuga1000.github.io/ghostline-web/"
    echo "📁 Репозиторий: https://github.com/yuga1000/ghostline-web"
else
    echo ""
    echo "❌ Ошибка при отправке"
fi

echo ""
read -p "Нажмите Enter для закрытия..."
