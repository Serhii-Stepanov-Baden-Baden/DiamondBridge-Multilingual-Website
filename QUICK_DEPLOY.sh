#!/bin/bash

# 🚀 DiamondBridge - Быстрое развертывание
# Скрипт для автоматической настройки GitHub и Vercel

echo "📦 DiamondBridge Project Deployment"
echo "=================================="

# Проверка наличия Git
if ! command -v git &> /dev/null; then
    echo "❌ Git не установлен. Установите Git и повторите."
    exit 1
fi

# Инициализация Git
echo "🔧 Инициализация Git..."
git init
git add .
git commit -m "✨ Initial commit: DiamondBridge multilingual project with backend"

# Создание .gitignore если его нет
if [ ! -f .gitignore ]; then
    cat > .gitignore << EOF
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
build/
dist/
.next/
out/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Runtime
pids/
*.pid
*.seed
*.pid.lock

# Coverage
coverage/
.nyc_output/

# Temporary files
tmp/
temp/
EOF
    echo "✅ Создан .gitignore"
fi

echo ""
echo "🎯 Следующие шаги:"
echo "1. Создайте репозиторий на https://github.com/new"
echo "2. Выполните команды:"
echo ""
echo "git remote add origin https://github.com/Serhii-Stepanov-Baden-Baden/DiamondBridge.git"
echo "git push -u origin main"
echo ""
echo "3. Подключите Vercel:"
echo "   - https://vercel.com/serhii-stepanov-s-projects"
echo "   - Импортируйте репозиторий"
echo ""
echo "✅ Подготовка завершена!"