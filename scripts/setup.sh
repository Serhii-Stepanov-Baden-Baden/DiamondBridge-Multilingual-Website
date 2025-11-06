#!/bin/bash

# ==============================================
# Скрипт первоначальной настройки проекта
# Настраивает окружение и зависимости
# ==============================================

set -e  # Прекратить выполнение при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для логирования
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}[УСПЕХ] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[ПРЕДУПРЕЖДЕНИЕ] $1${NC}"
}

error() {
    echo -e "${RED}[ОШИБКА] $1${NC}"
    exit 1
}

log "🔧 Начало первоначальной настройки проекта"

# Проверка операционной системы
OS="Unknown"
case "$(uname -s)" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    CYGWIN*)    MACHINE=Cygwin;;
    MINGW*)     MACHINE=MinGw;;
    *)          MACHINE="Unknown"
esac

log "🖥️  Операционная система: $MACHINE"

# Функция проверки версии Node.js
check_node_version() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | cut -d'v' -f2)
        
        if [ "$MAJOR_VERSION" -ge 16 ]; then
            success "✅ Node.js версии $NODE_VERSION обнаружен"
            return 0
        else
            error "❌ Требуется Node.js версии 16 или выше. Текущая версия: $NODE_VERSION"
        fi
    else
        error "❌ Node.js не установлен"
    fi
}

# Функция установки Node.js (для Ubuntu/Debian)
install_nodejs_ubuntu() {
    log "📦 Установка Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    success "✅ Node.js установлен"
}

# Функция установки Node.js (для macOS)
install_nodejs_macos() {
    log "📦 Установка Node.js через Homebrew..."
    if ! command -v brew &> /dev/null; then
        warning "Homebrew не установлен. Установите Homebrew сначала:"
        warning "/bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        return 1
    fi
    brew install node
    success "✅ Node.js установлен через Homebrew"
}

# Функция установки npm глобально
install_global_packages() {
    log "📦 Установка глобальных пакетов..."
    
    # Список необходимых глобальных пакетов
    GLOBAL_PACKAGES=(
        "vercel"
        "eslint"
        "prettier"
        "@vue/cli"
        "typescript"
    )
    
    for package in "${GLOBAL_PACKAGES[@]}"; do
        if npm list -g "$package" &> /dev/null; then
            log "✅ $package уже установлен"
        else
            log "📦 Установка $package..."
            npm install -g "$package"
            success "✅ $package установлен"
        fi
    done
}

# Функция создания структуры папок
create_directory_structure() {
    log "📁 Создание структуры папок..."
    
    DIRECTORIES=(
        "logs"
        "backups"
        "scripts"
        "docs/api"
        "src/assets/images"
        "src/assets/styles"
        "src/components/common"
        "src/views"
        "src/store"
        "src/utils"
        "tests/unit"
        "tests/integration"
        "tests/e2e"
        ".vscode"
    )
    
    for dir in "${DIRECTORIES[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            log "📁 Создана папка: $dir"
        else
            log "📂 Папка уже существует: $dir"
        fi
    done
    
    success "✅ Структура папок создана"
}

# Функция создания конфигурационных файлов
create_config_files() {
    log "⚙️  Создание конфигурационных файлов..."
    
    # .gitignore
    if [ ! -f ".gitignore" ]; then
        cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Grunt intermediate storage (https://gruntjs.com/creating-plugins#storing-task-files)
.grunt

# Bower dependency directory (https://bower.io/)
bower_components

# node-waf configuration
.lock-wscript

# Compiled binary addons (https://nodejs.org/api/addons.html)
build/Release

# Dependency directories
node_modules/
jspm_packages/

# Snowpack dependency directory (https://snowpack.dev/)
web_modules/

# TypeScript cache
*.tsbuildinfo

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Optional stylelint cache
.stylelintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variable files
.env
.env.development.local
.env.test.local
.env.production.local
.env.local

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js build output
.next
out

# Nuxt.js build / generate output
.nuxt
dist

# Gatsby files
.cache/
# Comment in the public line in if your project uses Gatsby and not Next.js
# https://nextjs.org/blog/next-9-1#public-directory-support
# public

# vuepress build output
.vuepress/dist

# vuepress v2.x temp and cache directory
.temp
.cache

# Docusaurus cache and generated files
.docusaurus

# Serverless directories
.serverless/

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# Stores VSCode versions used for testing VSCode extensions
.vscode-test

# yarn v2
.yarn/cache
.yarn/unplugged
.yarn/build-state.yml
.yarn/install-state.gz
.pnp.*

# IDEs and editors
/.idea
.project
.classpath
.c9/
*.launch
.settings/
*.sublime-workspace

# IDE - VSCode
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json
*.code-workspace

# Local History for Visual Studio Code
.history/

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
.pnpm-debug.log*

# Diagnostic reports (https://nodejs.org/api/report.html)
report.[0-9]*.[0-9]*.[0-9]*.[0-9]*.json

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Directory for instrumented libs generated by jscoverage/JSCover
lib-cov

# Coverage directory used by tools like istanbul
coverage
*.lcov

# nyc test coverage
.nyc_output

# Grunt intermediate storage (https://gruntjs.com/creating-plugins#storing-task-files)
.grunt

# Bower dependency directory (https://bower.io/)
bower_components

# node-waf configuration
.lock-wscript

# Compiled binary addons (https://nodejs.org/api/addons.html)
build/Release

# Dependency directories
node_modules/
jspm_packages/

# Snowpack dependency directory (https://snowpack.dev/)
web_modules/

# TypeScript cache
*.tsbuildinfo

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variable files
.env
.env.development.local
.env.test.local
.env.production.local
.env.local

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js build output
.next
out

# Nuxt.js build / generate output
.nuxt
dist

# Gatsby files
.cache/
# Comment in the public line in if your project uses Gatsby and not Next.js
# https://nextjs.org/blog/next-9-1#public-directory-support
# public

# vuepress build output
.vuepress/dist

# vuepress v2.x temp and cache directory
.temp
.cache

# Docusaurus cache and generated files
.docusaurus

# Serverless directories
.serverless/

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# Stores VSCode versions used for testing VSCode extensions
.vscode-test

# yarn v2
.yarn/cache
.yarn/unplugged
.yarn/build-state.yml
.yarn/install-state.gz
.pnp.*

# Vercel
.vercel

# Vite
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
EOF
        success "✅ .gitignore создан"
    else
        log "📄 .gitignore уже существует"
    fi
    
    # .env.example
    if [ ! -f ".env.example" ]; then
        cat > .env.example << 'EOF'
# Environment Variables Example
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
DB_HOST=localhost
DB_PORT=5432
DB_NAME=database_name
DB_USER=username
DB_PASSWORD=password

# API Configuration
API_BASE_URL=http://localhost:3000/api
API_VERSION=v1

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# External Services
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
EMAIL_SERVICE_API_KEY=your-email-service-api-key

# Vercel Configuration
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID=your-vercel-project-id

# GitHub Configuration
GITHUB_TOKEN=your-github-token
GITHUB_REPO_OWNER=your-username
GITHUB_REPO_NAME=your-repo-name

# Monitoring and Analytics
ANALYTICS_ID=your-analytics-id
SENTRY_DSN=your-sentry-dsn

# Feature Flags
FEATURE_NEW_UI=true
FEATURE_BETA_FEATURES=false
EOF
        success "✅ .env.example создан"
    else
        log "📄 .env.example уже существует"
    fi
    
    # .editorconfig
    if [ ! -f ".editorconfig" ]; then
        cat > .editorconfig << 'EOF'
root = true

[*]
charset = utf-8
end_of_line = lf
indent_size = 2
indent_style = space
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false

[*.{js,ts,jsx,tsx}]
indent_size = 2

[*.{json,yml,yaml}]
indent_size = 2

[*.{css,scss,less}]
indent_size = 2

[*.{html,xml}]
indent_size = 2
EOF
        success "✅ .editorconfig создан"
    else
        log "📄 .editorconfig уже существует"
    fi
}

# Функция создания README
create_readme() {
    if [ ! -f "README.md" ]; then
        cat > README.md << 'EOF'
# DiamondBridge - Multilingual Project

Описание проекта и инструкции по развертыванию.

## Быстрый старт

### Предварительные требования
- Node.js 16+
- npm или yarn
- Vercel CLI

### Установка зависимостей
```bash
npm install
```

### Настройка окружения
```bash
cp .env.example .env
# Отредактируйте .env файл с вашими настройками
```

### Запуск в режиме разработки
```bash
npm run dev
```

### Сборка для продакшена
```bash
npm run build
```

### Запуск тестов
```bash
npm test
```

## Скрипты автоматизации

### Развертывание
```bash
# Развертывание в продакшн
./scripts/deploy.sh

# Развертывание в staging
./scripts/deploy.sh project-name staging

# Развертывание в development
./scripts/deploy.sh project-name development dev-branch
```

### Настройка
```bash
# Первоначальная настройка проекта
./scripts/setup.sh
```

### Резервное копирование
```bash
# Создание бэкапа
./scripts/backup.sh
```

### Тестирование
```bash
# Запуск всех тестов
./scripts/test.sh

# Только unit тесты
npm run test:unit

# Только e2e тесты
npm run test:e2e
```

## Структура проекта

```
├── src/                    # Исходный код
├── scripts/                # Скрипты автоматизации
├── docs/                   # Документация
├── tests/                  # Тесты
├── backups/               # Резервные копии
├── logs/                  # Логи
└── .github/workflows/     # GitHub Actions
```

## CI/CD

Проект настроен для автоматического развертывания через GitHub Actions.

## Поддержка

Для получения помощи создайте issue в репозитории.
EOF
        success "✅ README.md создан"
    else
        log "📄 README.md уже существует"
    fi
}

# Функция инициализации git репозитория
init_git_repo() {
    if [ ! -d ".git" ]; then
        log "🔄 Инициализация Git репозитория..."
        git init
        git add .
        git commit -m "Initial commit: Project setup"
        success "✅ Git репозиторий инициализирован"
        
        # Создание основной ветки main
        if git branch | grep -q "main"; then
            git branch -M main
            success "✅ Ветка переименована в main"
        fi
    else
        log "🔄 Git репозиторий уже инициализирован"
    fi
}

# Функция настройки pre-commit hooks
setup_precommit_hooks() {
    log "🪝 Настройка pre-commit hooks..."
    
    # Создание pre-commit hook
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# Pre-commit hook для проверки качества кода

echo "🔍 Запуск pre-commit проверок..."

# Проверка eslint
if ! npm run lint; then
    echo "❌ ESLint проверка не пройдена"
    exit 1
fi

# Проверка prettier
if ! npm run format:check; then
    echo "❌ Prettier проверка не пройдена"
    exit 1
fi

# Проверка TypeScript
if ! npm run type-check; then
    echo "❌ TypeScript проверка не пройдена"
    exit 1
fi

echo "✅ Pre-commit проверки пройдены"
exit 0
EOF
    
    chmod +x .git/hooks/pre-commit
    success "✅ Pre-commit hooks настроены"
}

# Основная логика настройки
main() {
    log "🚀 Начинаем первоначальную настройку проекта..."
    
    # Проверка и установка Node.js
    if ! check_node_version; then
        case $MACHINE in
            "Linux")
                install_nodejs_ubuntu
                ;;
            "Mac")
                install_nodejs_macos
                ;;
            *)
                warning "Не удалось автоматически установить Node.js для вашей ОС"
                warning "Пожалуйста, установите Node.js 16+ вручную"
                ;;
        esac
        
        # Повторная проверка после установки
        check_node_version
    fi
    
    # Установка глобальных пакетов
    install_global_packages
    
    # Создание структуры папок
    create_directory_structure
    
    # Создание конфигурационных файлов
    create_config_files
    
    # Создание README
    create_readme
    
    # Инициализация git репозитория
    init_git_repo
    
    # Настройка pre-commit hooks
    setup_precommit_hooks
    
    # Установка зависимостей проекта
    if [ -f "package.json" ]; then
        log "📦 Установка зависимостей проекта..."
        npm install
        success "✅ Зависимости проекта установлены"
    else
        warning "package.json не найден. Установите зависимости вручную"
    fi
    
    # Создание папки для логов если не существует
    mkdir -p logs
    
    success "🎉 Первоначальная настройка завершена!"
    log "📝 Следующие шаги:"
    log "1. Отредактируйте .env файл с вашими настройками"
    log "2. Запустите npm run dev для проверки работы"
    log "3. Настройте Vercel: vercel login && vercel link"
    log "4. Настройте GitHub репозиторий и Actions"
}

# Обработка сигналов
trap 'error "Настройка прервана пользователем"' INT TERM

# Запуск основной функции
main "$@"