#!/bin/bash

# ==============================================
# Скрипт запуска тестов
# Автоматизирует процесс тестирования приложения
# ==============================================

set -e  # Прекратить выполнение при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Глобальные переменные
TEST_TYPE=${1:-"all"}  # all, unit, integration, e2e, lint, type-check
COVERAGE=${2:-"true"}  # true, false
BROWSER=${3:-"chrome"} # chrome, firefox, safari
VERBOSE=${4:-"false"}  # true, false
WATCH_MODE=${5:-"false"} # true, false
FAIL_FAST=${6:-"false"} # true, false

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

info() {
    echo -e "${PURPLE}[ИНФО] $1${NC}"
}

# Функция отображения справки
show_help() {
    cat << EOF
Использование: $0 [тип_тестов] [покрытие] [браузер] [подробный] [watch] [fail_fast]

Типы тестов:
  all           - Все тесты (по умолчанию)
  unit          - Только unit тесты
  integration   - Только integration тесты
  e2e           - Только end-to-end тесты
  lint          - Только линтинг
  type-check    - Только проверка типов

Параметры:
  покрытие      true/false - включить генерацию отчета о покрытии (по умолчанию: true)
  браузер       chrome/firefox/safari - браузер для e2e тестов (по умолчанию: chrome)
  подробный     true/false - подробный вывод (по умолчанию: false)
  watch         true/false - режим наблюдения (по умолчанию: false)
  fail_fast     true/false - остановить при первой ошибке (по умолчанию: false)

Примеры:
  $0                                    # Запустить все тесты
  $0 unit false                         # Только unit тесты без покрытия
  $0 e2e true chrome true               # E2E тесты с покрытием в Chrome
  $0 lint                               # Только линтинг

EOF
}

# Функция проверки зависимостей
check_dependencies() {
    log "🔍 Проверка зависимостей..."
    
    # Проверка Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js не установлен"
    fi
    
    # Проверка npm
    if ! command -v npm &> /dev/null; then
        error "npm не установлен"
    fi
    
    # Проверка наличия package.json
    if [ ! -f "package.json" ]; then
        error "package.json не найден"
    fi
    
    # Проверка Jest
    if ! npm list jest &> /dev/null; then
        warning "Jest не установлен. Устанавливаю..."
        npm install --save-dev jest
    fi
    
    # Проверка Playwright для e2e тестов
    if [[ "$TEST_TYPE" == "e2e" || "$TEST_TYPE" == "all" ]]; then
        if ! npm list @playwright/test &> /dev/null; then
            warning "Playwright не установлен. Устанавливаю..."
            npm install --save-dev @playwright/test
            npx playwright install --with-deps
        fi
    fi
    
    success "✅ Все зависимости проверены"
}

# Функция очистки результатов предыдущих тестов
cleanup_previous_results() {
    log "🧹 Очистка предыдущих результатов тестирования..."
    
    # Удаление старых отчетов о покрытии
    rm -rf coverage/
    rm -rf test-results/
    rm -rf junit.xml
    rm -rf playwright-report/
    
    # Очистка кэша Jest
    if [ -d "jest-cache" ]; then
        rm -rf jest-cache
        success "🗑️  Кэш Jest очищен"
    fi
    
    success "✅ Очистка завершена"
}

# Функция выполнения lint проверок
run_lint_tests() {
    log "🔍 Запуск линтинг проверок..."
    
    # ESLint
    if npm run lint --silent 2>&1; then
        success "✅ ESLint проверка пройдена"
    else
        error "❌ ESLint проверка не пройдена"
    fi
    
    # Prettier
    if npm run format:check --silent 2>&1; then
        success "✅ Prettier проверка пройдена"
    else
        error "❌ Prettier проверка не пройдена"
    fi
}

# Функция проверки типов
run_type_check() {
    log "📝 Проверка типов TypeScript..."
    
    if npm run type-check --silent 2>&1; then
        success "✅ Проверка типов пройдена"
    else
        error "❌ Проверка типов не пройдена"
    fi
}

# Функция выполнения unit тестов
run_unit_tests() {
    log "🧪 Запуск unit тестов..."
    
    # Подготовка команды Jest
    local jest_cmd="npm test -- --testPathPattern=tests/unit"
    
    # Режим наблюдения
    if [[ "$WATCH_MODE" == "true" ]]; then
        jest_cmd="$jest_cmd --watch"
    fi
    
    # Остановка при первой ошибке
    if [[ "$FAIL_FAST" == "true" ]]; then
        jest_cmd="$jest_cmd --bail"
    fi
    
    # Покрытие кода
    if [[ "$COVERAGE" == "true" ]]; then
        jest_cmd="$jest_cmd --coverage --coverageDirectory=coverage/unit"
    fi
    
    # Подробный вывод
    if [[ "$VERBOSE" == "true" ]]; then
        jest_cmd="$jest_cmd --verbose"
    fi
    
    # Дополнительные флаги для CI/CD
    if [ ! -t 0 ]; then
        jest_cmd="$jest_cmd --ci --reporters=default --reporters=jest-junit"
    fi
    
    # Выполнение тестов
    if eval "$jest_cmd"; then
        success "✅ Unit тесты пройдены"
    else
        error "❌ Unit тесты не пройдены"
    fi
}

# Функция выполнения integration тестов
run_integration_tests() {
    log "🔗 Запуск integration тестов..."
    
    # Подготовка команды Jest
    local jest_cmd="npm test -- --testPathPattern=tests/integration"
    
    # Остановка при первой ошибке
    if [[ "$FAIL_FAST" == "true" ]]; then
        jest_cmd="$jest_cmd --bail"
    fi
    
    # Покрытие кода
    if [[ "$COVERAGE" == "true" ]]; then
        jest_cmd="$jest_cmd --coverage --coverageDirectory=coverage/integration"
    fi
    
    # Подробный вывод
    if [[ "$VERBOSE" == "true" ]]; then
        jest_cmd="$jest_cmd --verbose"
    fi
    
    # Дополнительные флаги для CI/CD
    if [ ! -t 0 ]; then
        jest_cmd="$jest_cmd --ci --reporters=default --reporters=jest-junit"
    fi
    
    # Выполнение тестов
    if eval "$jest_cmd"; then
        success "✅ Integration тесты пройдены"
    else
        error "❌ Integration тесты не пройдены"
    fi
}

# Функция выполнения e2e тестов
run_e2e_tests() {
    log "🌐 Запуск end-to-end тестов..."
    
    # Подготовка команды Playwright
    local playwright_cmd="npx playwright test"
    
    # Выбор браузера
    case $BROWSER in
        "chrome")
            playwright_cmd="$playwright_cmd --project=chromium"
            ;;
        "firefox")
            playwright_cmd="$playwright_cmd --project=firefox"
            ;;
        "safari")
            playwright_cmd="$playwright_cmd --project=webkit"
            ;;
        "all")
            playwright_cmd="$playwright_cmd"  # Все браузеры
            ;;
    esac
    
    # Режим наблюдения
    if [[ "$WATCH_MODE" == "true" ]]; then
        playwright_cmd="$playwright_cmd --ui"
    fi
    
    # Покрытие кода (только для поддерживаемых браузеров)
    if [[ "$COVERAGE" == "true" && "$BROWSER" == "chrome" ]]; then
        playwright_cmd="$playwright_cmd --coverage"
    fi
    
    # Подробный вывод
    if [[ "$VERBOSE" == "true" ]]; then
        playwright_cmd="$playwright_cmd --reporter=line"
    else
        playwright_cmd="$playwright_cmd --reporter=dot"
    fi
    
    # Генерация HTML отчета
    playwright_cmd="$playwright_cmd --reporter=html"
    
    # Выполнение тестов
    if eval "$playwright_cmd"; then
        success "✅ E2E тесты пройдены"
        
        # Показать ссылку на отчет
        if [ -f "playwright-report/index.html" ]; then
            info "📊 Отчет E2E тестов доступен в playwright-report/index.html"
        fi
    else
        error "❌ E2E тесты не пройдены"
    fi
}

# Функция генерации отчета о покрытии
generate_coverage_report() {
    if [[ "$COVERAGE" == "true" ]]; then
        log "📊 Генерация отчета о покрытии кода..."
        
        # Создание HTML отчета о покрытии
        if command -v npx &> /dev/null; then
            npx nyc report --reporter=html --reporter=text --reporter=json
            success "✅ Отчет о покрытии сгенерирован в папке coverage/"
            
            # Показать краткую сводку
            if [ -f "coverage/coverage-summary.json" ]; then
                info "📈 Общее покрытие кода:"
                npx nyc report --reporter=text | tail -5
            fi
        fi
    fi
}

# Функция создания отчета JUnit для CI/CD
generate_junit_report() {
    if [ ! -t 0 ]; then  # Если запущено в CI/CD
        log "📄 Создание JUnit отчета для CI/CD..."
        
        # Jest JUnit отчет
        if npm run test -- --ci --reporters=default --reporters=jest-junit 2>/dev/null; then
            success "✅ JUnit отчет создан"
        fi
        
        # Playwright JUnit отчет
        npx playwright test --reporter=junit > junit-playwright.xml 2>/dev/null
    fi
}

# Функция сохранения результатов тестирования
save_test_results() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local results_dir="logs/test-results"
    
    mkdir -p "$results_dir"
    
    # Сохранение логов тестирования
    if [ -f "junit.xml" ]; then
        cp "junit.xml" "$results_dir/junit_${timestamp}.xml"
    fi
    
    if [ -f "coverage/coverage-summary.json" ]; then
        cp "coverage/coverage-summary.json" "$results_dir/coverage_${timestamp}.json"
    fi
    
    # Сохранение отчета Playwright
    if [ -d "playwright-report" ]; then
        cp -r "playwright-report" "$results_dir/playwright-report-${timestamp}"
    fi
    
    info "📁 Результаты тестирования сохранены в $results_dir/"
}

# Функция отправки уведомлений
send_notifications() {
    local status=$1
    local test_type=$2
    
    # Slack уведомление (если настроено)
    if [ ! -z "$SLACK_WEBHOOK" ]; then
        local message=""
        case $status in
            "success")
                message="✅ Тесты $test_type успешно завершены!"
                ;;
            "failure")
                message="❌ Тесты $test_type провалились!"
                ;;
        esac
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\n📊 Покрытие: $COVERAGE\n🌐 Браузер: $BROWSER\"}" \
            $SLACK_WEBHOOK 2>/dev/null
    fi
}

# Функция отображения итоговой сводки
show_summary() {
    log "📊 Сводка результатов тестирования"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}Тип тестов:${NC}        $TEST_TYPE"
    echo -e "${BLUE}Покрытие кода:${NC}    $COVERAGE"
    echo -e "${BLUE}Браузер E2E:${NC}      $BROWSER"
    echo -e "${BLUE}Подробный режим:${NC}  $VERBOSE"
    echo -e "${BLUE}Режим наблюдения:${NC} $WATCH_MODE"
    echo -e "${BLUE}Остановка при ошибке:${NC} $FAIL_FAST"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [ -d "coverage" ]; then
        echo -e "${GREEN}📈 Отчет о покрытии:${NC} ./coverage/index.html"
    fi
    
    if [ -d "playwright-report" ]; then
        echo -e "${GREEN}🌐 E2E отчет:${NC} ./playwright-report/index.html"
    fi
    
    if [ -d "logs/test-results" ]; then
        echo -e "${GREEN}📁 Логи тестов:${NC} ./logs/test-results/"
    fi
    
    echo ""
}

# Основная функция
main() {
    # Проверка параметров
    if [[ "$1" == "--help" || "$1" == "-h" ]]; then
        show_help
        exit 0
    fi
    
    log "🧪 Запуск системы тестирования"
    info "🎯 Тип тестов: $TEST_TYPE"
    info "📊 Покрытие кода: $COVERAGE"
    info "🌐 Браузер E2E: $BROWSER"
    
    # Проверка зависимостей
    check_dependencies
    
    # Очистка предыдущих результатов
    cleanup_previous_results
    
    # Переменная для отслеживания статуса выполнения
    local overall_success=true
    
    # Выполнение тестов в зависимости от типа
    case $TEST_TYPE in
        "all")
            log "🚀 Запуск всех тестов..."
            run_lint_tests || overall_success=false
            run_type_check || overall_success=false
            run_unit_tests || overall_success=false
            run_integration_tests || overall_success=false
            run_e2e_tests || overall_success=false
            ;;
        "lint")
            run_lint_tests || overall_success=false
            ;;
        "type-check")
            run_type_check || overall_success=false
            ;;
        "unit")
            run_unit_tests || overall_success=false
            ;;
        "integration")
            run_integration_tests || overall_success=false
            ;;
        "e2e")
            run_e2e_tests || overall_success=false
            ;;
        *)
            error "Неизвестный тип тестов: $TEST_TYPE"
            ;;
    esac
    
    # Генерация отчетов
    generate_coverage_report
    generate_junit_report
    save_test_results
    
    # Отображение итоговой сводки
    show_summary
    
    # Отправка уведомлений
    if [ "$overall_success" = true ]; then
        success "🎉 Все тесты успешно пройдены!"
        send_notifications "success" "$TEST_TYPE"
        exit 0
    else
        error "❌ Некоторые тесты провалились!"
        send_notifications "failure" "$TEST_TYPE"
        exit 1
    fi
}

# Обработка сигналов
trap 'error "Тестирование прервано пользователем"' INT TERM

# Запуск основной функции
main "$@"