#!/bin/bash

# ==============================================
# Скрипт резервного копирования
# Автоматизирует создание и управление бэкапами
# ==============================================

set -e  # Прекратить выполнение при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Конфигурация
BACKUP_TYPE=${1:-"auto"}  # auto, full, code, database, config
BACKUP_NAME=${2:-""}      # Пользовательское имя бэкапа
COMPRESS=${3:-"true"}     # true, false - сжимать ли бэкап
ENCRYPT=${4:-"false"}     # true, false - шифровать ли бэкап
CLOUD_SYNC=${5:-"false"}  # true, false - синхронизировать ли с облаком
KEEP_LOCAL=${6:-"30"}     # Количество дней для хранения локальных бэкапов

# Пути и настройки
BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME_FULL="${BACKUP_NAME:-project_backup}_${TIMESTAMP}"
ARCHIVE_NAME="${BACKUP_NAME_FULL}.tar.gz"

# Функции логирования
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
Использование: $0 [тип] [имя] [сжатие] [шифрование] [облако] [дней_хранения]

Типы бэкапов:
  auto      - Автоматическое определение (по умолчанию)
  full      - Полный бэкап всего проекта
  code      - Только исходный код
  database  - Только база данных
  config    - Только конфигурационные файлы

Параметры:
  имя            Пользовательское имя бэкапа (опционально)
  сжатие         true/false - сжимать ли бэкап (по умолчанию: true)
  шифрование     true/false - шифровать ли бэкап (по умолчанию: false)
  облако         true/false - синхронизировать ли с облаком (по умолчанию: false)
  дней_хранения  Количество дней хранения локальных бэкапов (по умолчанию: 30)

Примеры:
  $0                          # Автоматический бэкап с сжатием
  $0 full myproject false     # Полный бэкап без сжатия
  $0 code code_backup true true  # Бэкап кода с сжатием и шифрованием
  $0 database "" false false true  # Бэкап БД без сжатия с синхронизацией

EOF
}

# Функция проверки зависимостей
check_dependencies() {
    log "🔍 Проверка зависимостей..."
    
    # Проверка необходимых команд
    local required_commands=("tar" "gzip" "find")
    for cmd in "${required_commands[@]}"; do
        if ! command -v $cmd &> /dev/null; then
            error "Команда '$cmd' не найдена. Установите её для продолжения."
        fi
    done
    
    # Проверка дополнительных команд для расширенного функционала
    if [[ "$ENCRYPT" == "true" ]]; then
        if ! command -v gpg &> /dev/null; then
            warning "GPG не установлен. Шифрование недоступно."
            ENCRYPT="false"
        fi
    fi
    
    if [[ "$CLOUD_SYNC" == "true" ]]; then
        if ! command -v rclone &> /dev/null; then
            warning "rclone не установлен. Синхронизация с облаком недоступна."
            CLOUD_SYNC="false"
        fi
    fi
    
    success "✅ Зависимости проверены"
}

# Функция создания директории для бэкапов
setup_backup_directory() {
    log "📁 Настройка директории для бэкапов..."
    
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        success "📁 Создана директория для бэкапов: $BACKUP_DIR"
    else
        log "📂 Директория для бэкапов уже существует: $BACKUP_DIR"
    fi
    
    # Создание поддиректорий
    mkdir -p "$BACKUP_DIR"/{full,code,database,config,logs}
    
    success "✅ Структура директорий настроена"
}

# Функция получения списка файлов для бэкапа
get_backup_files() {
    local backup_type=$1
    local temp_list="/tmp/backup_files_${TIMESTAMP}.txt"
    
    case $backup_type in
        "full")
            # Полный бэкап - все файлы кроме игнорируемых
            find . -type f ! -path "./$BACKUP_DIR/*" ! -path "./node_modules/*" ! -path "./.git/*" ! -name "*.log" > "$temp_list"
            ;;
        "code")
            # Только исходный код
            find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" -o -name "*.vue" -o -name "*.css" -o -name "*.scss" -o -name "*.less" -o -name "*.html" -o -name "*.json" -o -name "*.md" \) ! -path "./$BACKUP_DIR/*" ! -path "./node_modules/*" ! -path "./.git/*" > "$temp_list"
            ;;
        "database")
            # Файлы базы данных и миграции
            find . -type f \( -name "*.sql" -o -name "*.db" -o -name "*.sqlite" -o -path "*/migrations/*" -o -path "*/database/*" \) ! -path "./$BACKUP_DIR/*" ! -path "./.git/*" > "$temp_list"
            ;;
        "config")
            # Конфигурационные файлы
            find . -type f \( -name "*.json" -o -name "*.yml" -o -name "*.yaml" -o -name "*.env*" -o -name "*.conf" -o -name "*.config.js" -o -name "*.config.ts" \) ! -path "./node_modules/*" ! -path "./.git/*" > "$temp_list"
            ;;
        "auto")
            # Автоматическое определение - анализируем структуру проекта
            if [ -f "package.json" ]; then
                get_backup_files "full"
            elif [ -f "requirements.txt" ] || [ -f "Pipfile" ]; then
                get_backup_files "code"
            else
                get_backup_files "full"
            fi
            return
            ;;
    esac
    
    echo "$temp_list"
}

# Функция создания файла манифеста бэкапа
create_backup_manifest() {
    local backup_dir=$1
    local backup_type=$2
    
    local manifest_file="$backup_dir/manifest.json"
    
    # Создание манифеста с метаданными бэкапа
    cat > "$manifest_file" << EOF
{
  "backup_name": "$BACKUP_NAME_FULL",
  "backup_type": "$backup_type",
  "timestamp": "$(date -Iseconds)",
  "hostname": "$(hostname)",
  "user": "$(whoami)",
  "project_path": "$(pwd)",
  "node_version": "$(node --version 2>/dev/null || echo 'not installed')",
  "npm_version": "$(npm --version 2>/dev/null || echo 'not installed')",
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'no git')",
  "git_branch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'no git')",
  "files_count": "$(find $backup_dir -type f ! -name "manifest.json" | wc -l)",
  "total_size": "$(du -sh $backup_dir | cut -f1)",
  "compressed": $COMPRESS,
  "encrypted": $ENCRYPT
}
EOF
    
    log "📋 Создан манифест бэкапа: $manifest_file"
}

# Функция сжатия бэкапа
compress_backup() {
    local source_dir=$1
    local output_file="$BACKUP_DIR/${ARCHIVE_NAME%.*}"
    
    if [[ "$COMPRESS" == "true" ]]; then
        log "🗜️  Сжатие бэкапа..."
        
        cd "$source_dir"
        tar -czf "../${ARCHIVE_NAME%.*}.tar.gz" .
        cd - > /dev/null
        
        # Получение размера архива
        local compressed_size=$(du -sh "$BACKUP_DIR/${ARCHIVE_NAME%.*}.tar.gz" | cut -f1)
        success "✅ Бэкап сжат: ${ARCHIVE_NAME%.*}.tar.gz ($compressed_size)"
        
        # Удаление несжатой директории
        rm -rf "$source_dir"
    else
        log "📁 Создание несжатого бэкапа..."
        mv "$source_dir" "$BACKUP_DIR/$BACKUP_NAME_FULL"
        success "✅ Несжатый бэкап создан: $BACKUP_DIR/$BACKUP_NAME_FULL"
    fi
}

# Функция шифрования бэкапа
encrypt_backup() {
    local backup_file=$1
    
    if [[ "$ENCRYPT" == "true" ]]; then
        log "🔐 Шифрование бэкапа..."
        
        # Проверка наличия GPG ключей
        if ! gpg --list-secret-keys --keyid-format LONG | grep -q "sec"; then
            warning "GPG ключи не найдены. Создание нового ключа..."
            read -p "Введите email для GPG ключа: " user_email
            
            gpg --batch --gen-key << EOF
%echo Generating a basic OpenPGP key
Key-Type: RSA
Key-Length: 2048
Name-Real: $user
Name-Email: $user_email
Expire-Date: 0
%no-protection
%commit
%echo done
EOF
        fi
        
        # Получение ID ключа
        local key_id=$(gpg --list-secret-keys --keyid-format LONG | grep "sec" | tail -1 | awk '{print $2}' | cut -d'/' -f2)
        
        # Шифрование файла
        if [[ "$COMPRESS" == "true" ]]; then
            gpg --symmetric --cipher-algo AES256 --compress-algo 1 --s2k-mode 3 --s2k-digest-algo SHA512 --s2k-count 65536 --batch --yes --passphrase "$BACKUP_ENCRYPTION_PASSPHRASE" --output "${backup_file}.gpg" "$backup_file"
            rm -f "$backup_file"
        else
            gpg --symmetric --cipher-algo AES256 --compress-algo 1 --s2k-mode 3 --s2k-digest-algo SHA512 --s2k-count 65536 --batch --yes --passphrase "$BACKUP_ENCRYPTION_PASSPHRASE" --output "${backup_file}.gpg" "$backup_file"
            rm -rf "$backup_file"
        fi
        
        success "✅ Бэкап зашифрован: ${backup_file}.gpg"
    fi
}

# Функция синхронизации с облаком
sync_to_cloud() {
    local backup_file=$1
    
    if [[ "$CLOUD_SYNC" == "true" ]]; then
        log "☁️  Синхронизация с облачным хранилищем..."
        
        # Проверка настроек rclone
        if ! rclone listremotes | grep -q ":"; then
            warning "Настройки rclone не найдены. Запустите 'rclone config' для настройки."
            return 1
        fi
        
        # Синхронизация файла
        local cloud_path="cloud-backups/$(basename $backup_file)"
        
        if rclone copy "$backup_file" "$cloud_path"; then
            success "✅ Бэкап синхронизирован с облаком: $cloud_path"
        else
            error "❌ Ошибка синхронизации с облаком"
        fi
    fi
}

# Функция создания бэкапа
create_backup() {
    log "🚀 Начало создания бэкапа типа '$BACKUP_TYPE'"
    
    # Получение списка файлов
    local files_list=$(get_backup_files "$BACKUP_TYPE")
    local files_count=$(wc -l < "$files_list")
    
    if [ "$files_count" -eq 0 ]; then
        error "❌ Не найдено файлов для бэкапа типа '$BACKUP_TYPE'"
    fi
    
    info "📊 Найдено $files_count файлов для бэкапа"
    
    # Создание временной директории для бэкапа
    local temp_backup_dir="/tmp/$BACKUP_NAME_FULL"
    mkdir -p "$temp_backup_dir"
    
    # Копирование файлов в бэкап
    log "📋 Копирование файлов..."
    local copied_count=0
    while IFS= read -r file; do
        if [ -f "$file" ]; then
            # Создание директории в бэкапе
            local backup_path="$temp_backup_dir/$(dirname "$file")"
            mkdir -p "$backup_path"
            
            # Копирование файла
            cp "$file" "$backup_path/"
            ((copied_count++))
        fi
    done < "$files_list"
    
    info "✅ Скопировано $copied_count файлов"
    
    # Создание манифеста
    create_backup_manifest "$temp_backup_dir" "$BACKUP_TYPE"
    
    # Сжатие бэкапа
    compress_backup "$temp_backup_dir"
    
    # Определение финального пути к бэкапу
    local final_backup_path
    if [[ "$COMPRESS" == "true" ]]; then
        final_backup_path="$BACKUP_DIR/${ARCHIVE_NAME%.*}.tar.gz"
    else
        final_backup_path="$BACKUP_DIR/$BACKUP_NAME_FULL"
    fi
    
    # Шифрование бэкапа
    if [[ "$ENCRYPT" == "true" ]]; then
        encrypt_backup "$final_backup_path"
        final_backup_path="${final_backup_path}.gpg"
    fi
    
    # Синхронизация с облаком
    if [[ "$CLOUD_SYNC" == "true" ]]; then
        sync_to_cloud "$final_backup_path"
    fi
    
    # Получение информации о размере
    local backup_size=$(du -sh "$final_backup_path" | cut -f1)
    success "🎉 Бэкап создан: $final_backup_path ($backup_size)"
    
    # Запись в историю бэкапов
    echo "[$(date)] $BACKUP_TYPE бэкап: $final_backup_path ($backup_size)" >> "$BACKUP_DIR/backup_history.log"
    
    # Очистка временных файлов
    rm -f "$files_list"
    
    return 0
}

# Функция очистки старых бэкапов
cleanup_old_backups() {
    log "🧹 Очистка старых бэкапов (старше $KEEP_LOCAL дней)..."
    
    # Поиск файлов старше указанного количества дней
    local deleted_count=0
    local total_size_freed=0
    
    while IFS= read -r backup_file; do
        if [ -f "$backup_file" ] || [ -d "$backup_file" ]; then
            local file_size=$(du -sb "$backup_file" | cut -f1)
            local file_size_mb=$((file_size / 1024 / 1024))
            
            rm -rf "$backup_file"
            ((deleted_count++))
            total_size_freed=$((total_size_freed + file_size))
            
            log "🗑️  Удален: $(basename "$backup_file")"
        fi
    done < <(find "$BACKUP_DIR" -type f -o -type d ! -name "backup_history.log" -mtime +$KEEP_LOCAL)
    
    local freed_mb=$((total_size_freed / 1024 / 1024))
    success "✅ Очистка завершена: удалено $deleted_count бэкапов, освобождено ${freed_mb}MB"
}

# Функция восстановления из бэкапа
restore_backup() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        error "❌ Укажите путь к файлу бэкапа для восстановления"
    fi
    
    if [ ! -f "$backup_file" ]; then
        error "❌ Файл бэкапа не найден: $backup_file"
    fi
    
    log "🔄 Восстановление из бэкапа: $backup_file"
    
    # Подтверждение операции
    read -p "⚠️  ВНИМАНИЕ: Это перезапишет существующие файлы. Продолжить? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "❌ Восстановление отменено"
        exit 1
    fi
    
    # Определение типа файла
    local temp_restore_dir="/tmp/restore_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$temp_restore_dir"
    
    # Расшифровка если необходимо
    local restore_source="$backup_file"
    if [[ "$backup_file" == *.gpg ]]; then
        log "🔓 Расшифровка бэкапа..."
        if [[ -z "$BACKUP_ENCRYPTION_PASSPHRASE" ]]; then
            echo -n "Введите пароль для расшифровки: "
            read -s passphrase
            echo
            BACKUP_ENCRYPTION_PASSPHRASE=$passphrase
        fi
        
        gpg --decrypt --passphrase "$BACKUP_ENCRYPTION_PASSPHRASE" --output "$temp_restore_dir/${backup_file%.gpg}" "$backup_file"
        restore_source="$temp_restore_dir/${backup_file%.gpg}"
    fi
    
    # Извлечение архива
    if [[ "$restore_source" == *.tar.gz ]]; then
        log "📦 Извлечение архива..."
        tar -xzf "$restore_source" -C "$temp_restore_dir"
        restore_source="$temp_restore_dir"
    fi
    
    # Копирование файлов обратно
    log "📋 Восстановление файлов..."
    cp -r "$restore_source"/* .
    
    # Очистка
    rm -rf "$temp_restore_dir"
    
    success "✅ Восстановление завершено"
}

# Функция отображения списка бэкапов
list_backups() {
    log "📋 Список доступных бэкапов:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [ ! "$(ls -A $BACKUP_DIR 2>/dev/null | grep -v backup_history.log)" ]; then
        info "Бэкапы не найдены"
        return
    fi
    
    # Заголовок
    printf "%-20s %-10s %-12s %-15s %s\n" "ИМЯ" "РАЗМЕР" "ДАТА" "ТИП" "СОСТОЯНИЕ"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Список файлов бэкапов
    for item in "$BACKUP_DIR"/*; do
        if [ -f "$item" ]; then
            local basename=$(basename "$item")
            local size=$(du -sh "$item" | cut -f1)
            local date=$(stat -c %y "$item" | cut -d' ' -f1)
            local type="неизвестно"
            local status="✅"
            
            # Определение типа по имени
            case $basename in
                *.tar.gz) type="сжатый" ;;
                *.gpg) type="зашифрованный" ;;
                *.tar.gz.gpg) type="сжатый+шифр." ;;
            esac
            
            # Проверка целостности
            if [[ "$basename" == *.gpg ]]; then
                if ! gpg --list-packets "$item" >/dev/null 2>&1; then
                    status="❌ поврежден"
                fi
            elif [[ "$basename" == *.tar.gz* ]]; then
                if ! tar -tzf "$item" >/dev/null 2>&1; then
                    status="❌ поврежден"
                fi
            fi
            
            printf "%-20s %-10s %-12s %-15s %s\n" "$basename" "$size" "$date" "$type" "$status"
        elif [ -d "$item" ]; then
            local basename=$(basename "$item")
            local size=$(du -sh "$item" | cut -f1)
            local date=$(stat -c %y "$item" | cut -d' ' -f1)
            local type="директория"
            
            printf "%-20s %-10s %-12s %-15s %s\n" "$basename" "$size" "$date" "$type" "✅"
        fi
    done
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Показать историю если существует
    if [ -f "$BACKUP_DIR/backup_history.log" ]; then
        echo ""
        info "📜 Последние операции бэкапа:"
        tail -5 "$BACKUP_DIR/backup_history.log"
    fi
}

# Функция проверки целостности бэкапа
verify_backup() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        error "❌ Укажите путь к файлу бэкапа для проверки"
    fi
    
    if [ ! -f "$backup_file" ]; then
        error "❌ Файл бэкапа не найден: $backup_file"
    fi
    
    log "🔍 Проверка целостности бэкапа: $backup_file"
    
    # Проверка зашифрованных файлов
    if [[ "$backup_file" == *.gpg ]]; then
        if gpg --list-packets "$backup_file" >/dev/null 2>&1; then
            success "✅ GPG файл корректен"
        else
            error "❌ GPG файл поврежден или неверный пароль"
        fi
    fi
    
    # Проверка архивов
    if [[ "$backup_file" == *.tar.gz* ]]; then
        if tar -tzf "$backup_file" >/dev/null 2>&1; then
            success "✅ TAR.GZ архив корректен"
        else
            error "❌ TAR.GZ архив поврежден"
        fi
    fi
    
    # Проверка размера
    local size=$(du -sh "$backup_file" | cut -f1)
    info "📊 Размер файла: $size"
    
    success "✅ Проверка целостности завершена"
}

# Основная функция
main() {
    # Проверка параметров
    if [[ "$1" == "--help" || "$1" == "-h" ]]; then
        show_help
        exit 0
    fi
    
    if [[ "$1" == "restore" ]]; then
        restore_backup "$2"
        exit 0
    elif [[ "$1" == "list" ]]; then
        list_backups
        exit 0
    elif [[ "$1" == "verify" ]]; then
        verify_backup "$2"
        exit 0
    elif [[ "$1" == "cleanup" ]]; then
        cleanup_old_backups
        exit 0
    fi
    
    log "💾 Запуск системы резервного копирования"
    info "🎯 Тип бэкапа: $BACKUP_TYPE"
    info "📦 Сжатие: $COMPRESS"
    info "🔐 Шифрование: $ENCRYPT"
    info "☁️  Облачная синхронизация: $CLOUD_SYNC"
    
    # Проверка зависимостей
    check_dependencies
    
    # Настройка директорий
    setup_backup_directory
    
    # Создание бэкапа
    if create_backup; then
        # Очистка старых бэкапов
        cleanup_old_backups
        
        success "🎉 Резервное копирование успешно завершено!"
    else
        error "❌ Ошибка при создании резервной копии"
    fi
}

# Обработка сигналов
trap 'error "Резервное копирование прервано пользователем"' INT TERM

# Запуск основной функции
main "$@"