#!/bin/bash

# Скрипт для быстрого обновления сайта ghostline-web
# Автоматически добавляет все изменения и пушит на GitHub

echo "🔄 Обновление сайта ghostline-web..."

# Переходим в директорию скрипта
cd "$(dirname "$0")"

# Проверяем статус
echo "📊 Проверяем изменения..."
git status --short

# Если нет изменений
if [ -z "$(git status --porcelain)" ]; then
    echo "✅ Нет изменений для отправки"
    exit 0
fi

# Создаем коммит с текущим временем
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
COMMIT_MSG="Website update - $TIMESTAMP"

echo "📝 Создаем коммит: $COMMIT_MSG"

# Добавляем все изменения
git add .

# Создаем коммит
git commit -m "$COMMIT_MSG"

# Пушим на GitHub
echo "🚀 Отправляем на GitHub..."
git push origin main

# Проверяем результат
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ УСПЕШНО ОБНОВЛЕНО!"
    echo "🌐 Сайт: https://yuga1000.github.io/ghostline-web/"
    echo "📁 Репозиторий: https://github.com/yuga1000/ghostline-web"
    echo "⏰ Время: $TIMESTAMP"
else
    echo ""
    echo "❌ ОШИБКА при отправке на GitHub"
    exit 1
fi
