#!/bin/bash

# Автоматический push скрипт для ghostline-web
# Использование: ./auto-push.sh "комментарий к коммиту"

# Проверяем, что мы в правильной директории
if [ ! -d ".git" ]; then
    echo "Ошибка: Не найдена .git директория. Запустите скрипт из корня репозитория."
    exit 1
fi

# Проверяем, что есть изменения для коммита
if [ -z "$(git status --porcelain)" ]; then
    echo "Нет изменений для коммита."
    exit 0
fi

# Получаем комментарий к коммиту
COMMIT_MESSAGE=${1:-"Обновление сайта $(date '+%Y-%m-%d %H:%M:%S')"}

echo "Добавляем все изменения..."
git add .

echo "Создаем коммит: $COMMIT_MESSAGE"
git commit -m "$COMMIT_MESSAGE"

echo "Отправляем изменения на GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Успешно отправлено на GitHub!"
    echo "Ссылка: https://github.com/yuga1000/ghostline-web"
else
    echo "❌ Ошибка при отправке на GitHub"
    exit 1
fi
