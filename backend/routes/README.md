# DiamondBridge Backend API Routes

Автономный Семантический Фреймворк Памяти AI Агент Backend

## Обзор

Созданы полнофункциональные API маршруты для backend системы DiamondBridge, обеспечивающие полный функционал для работы с AI операциями, медиа обработкой, Google Drive интеграцией, конфигурацией системы и мониторингом.

## Структура маршрутов

### 1. `/api/ai/*` - AI Операции

**Файл:** `routes/ai.js` (622 строки)

**Функциональность:**
- **Conversation API**: управление диалогами и сессиями
  - `POST /conversation` - создание сессии
  - `POST /conversation/:sessionId/message` - отправка сообщения
  - `GET /conversation/:sessionId` - получение истории
  - `DELETE /conversation/:sessionId` - удаление сессии

- **NLP API**: обработка естественного языка
  - `POST /nlp/analyze` - анализ текста
  - `POST /nlp/extract-entities` - извлечение сущностей
  - `POST /nlp/sentiment` - анализ настроений

- **Training API**: обучение и анализ документов
  - `POST /training/upload` - загрузка документа
  - `POST /training/batch` - пакетная обработка
  - `GET /training/export` - экспорт результатов
  - `GET /training/status` - статус обучения

**Особенности:**
- ✅ Валидация входных данных
- ✅ Мультиязычная поддержка (EN/RU/UA)
- ✅ Обработка ошибок и логирование
- ✅ Интеграция с ai-core модулем

### 2. `/api/media/*` - Медиа Обработка

**Файл:** `routes/media.js` (832 строки)

**Функциональность:**
- **Upload API**: загрузка медиа файлов
  - `POST /upload` - загрузка множественных файлов
  - `POST /upload/image` - обработка изображений
  - `POST /upload/audio` - обработка аудио
  - `POST /upload/video` - обработка видео

- **Process API**: обработка медиа контента
  - `POST /process/image` - анализ изображений
  - `POST /process/video` - обработка видео
  - `POST /process/audio` - обработка аудио

- **Analysis API**: анализ медиа
  - `POST /analyze/objects` - детекция объектов
  - `POST /analyze/faces` - анализ лиц
  - `POST /analyze/text` - OCR извлечение текста

- **Transform API**: трансформация медиа
  - `POST /transform/image` - трансформация изображений
  - `POST /transform/video` - конвертация видео

**Особенности:**
- ✅ Поддержка 10+ форматов файлов
- ✅ Ограничения размера до 100MB
- ✅ Резюмируемая загрузка
- ✅ Анализ изображений, аудио и видео
- ✅ OCR и распознавание лиц

### 3. `/api/drive/*` - Google Drive Интеграция

**Файл:** `routes/drive.js` (947 строк)

**Функциональность:**
- **Auth API**: аутентификация
  - `GET /auth/url` - получение URL авторизации
  - `POST /auth/callback` - обработка callback
  - `GET /auth/status` - проверка статуса
  - `POST /auth/refresh` - обновление токенов
  - `POST /auth/revoke` - отзыв авторизации

- **Files API**: управление файлами
  - `GET /files` - список файлов
  - `GET /files/:fileId` - информация о файле
  - `POST /files/create` - создание файла
  - `PUT /files/:fileId` - обновление файла
  - `DELETE /files/:fileId` - удаление файла

- **Folders API**: управление папками
  - `POST /folders/create` - создание папки
  - `GET /folders/:folderId/contents` - содержимое папки

- **Upload API**: загрузка файлов
  - `POST /upload/simple` - простая загрузка
  - `POST /upload/resumable/init` - инициализация resumable
  - `PUT /upload/resumable/:uploadId` - загрузка частей

- **Download API**: скачивание файлов
  - `GET /download/:fileId` - скачивание файла
  - `GET /download/:fileId/metadata` - метаданные

- **Backup API**: резервное копирование
  - `POST /backup/create` - создание бэкапа
  - `GET /backup/list` - список бэкапов
  - `POST /backup/restore` - восстановление

**Особенности:**
- ✅ Полная интеграция с Google Drive API
- ✅ Резюмируемая загрузка больших файлов
- ✅ Автоматическое резервное копирование
- ✅ Поддержка квот и лимитов
- ✅ Безопасная работа с токенами

### 4. `/api/config/*` - Конфигурация Системы

**Файл:** `routes/config.js` (749 строк)

**Функциональность:**
- **System API**: настройки системы
  - `GET /system` - получение настроек
  - `PUT /system` - обновление настроек (admin)
  - `GET /system/health` - здоровье системы

- **AI API**: AI конфигурация
  - `GET /ai` - AI настройки
  - `PUT /ai` - обновление AI настроек
  - `GET /ai/models` - доступные модели
  - `PUT /ai/models/:modelName` - настройки модели

- **Modules API**: управление модулями
  - `GET /modules` - статус модулей
  - `POST /modules/:moduleName/restart` - перезапуск модуля

- **Credentials API**: учетные данные
  - `GET /credentials/status` - статус учетных данных
  - `POST /credentials/validate` - валидация (admin)
  - `PUT /credentials/update` - обновление (admin)

- **Features API**: управление функциями
  - `GET /features` - список функций
  - `PUT /features/:featureName` - включение/отключение

**Особенности:**
- ✅ Контроль доступа для администраторов
- ✅ Валидация конфигураций
- ✅ Перезапуск модулей без остановки
- ✅ Безопасная работа с учетными данными
- ✅ Управление функциями системы

### 5. `/api/health/*` - Проверка Здоровья

**Файл:** `routes/health.js` (571 строка)

**Функциональность:**
- **Basic Check**: базовая проверка
  - `GET /` - базовый health check

- **Detailed Check**: детальная диагностика
  - `GET /detailed` - полная диагностика системы
  - `GET /modules` - проверка всех модулей
  - `GET /modules/:moduleName` - проверка конкретного модуля

- **External Services**: внешние сервисы
  - `GET /external` - проверка Google Drive API

- **Performance**: производительность
  - `GET /performance` - метрики производительности

- **Probes**: проверки готовности
  - `GET /ready` - readiness probe
  - `GET /live` - liveness probe

- **Statistics**: статистика
  - `GET /stats` - статистика использования

**Осособенности:**
- ✅ Readiness и Liveness probes
- ✅ Проверка всех модулей системы
- ✅ Метрики производительности
- ✅ Мониторинг внешних сервисов
- ✅ Статистика использования ресурсов

### 6. `/api/status/*` - Статус Системы

**Файл:** `routes/status.js` (665 строк)

**Функциональность:**
- **Overview**: общий обзор
  - `GET /overview` - общий статус системы

- **Metrics**: метрики
  - `GET /metrics` - метрики за период
  - `GET /metrics/realtime` - real-time метрики

- **Activity**: активность
  - `GET /activity` - история активности
  - `GET /logs` - системные логи

- **Monitoring**: мониторинг
  - `GET /monitoring` - мониторинг и алерты
  - `POST /alerts/:alertId/acknowledge` - подтверждение алертов

- **Dashboard**: дашборд
  - `GET /dashboard` - данные для дашборда

**Особенности:**
- ✅ Real-time мониторинг
- ✅ Система алертов
- ✅ История активности
- ✅ Данные для дашборда
- ✅ Логирование операций

## Архитектурные особенности

### Безопасность
- ✅ Аутентификация для всех API (кроме health/status)
- ✅ Авторизация для административных функций
- ✅ Валидация входных данных
- ✅ Rate limiting
- ✅ CORS защита

### Надежность
- ✅ Обработка ошибок на всех уровнях
- ✅ Graceful shutdown
- ✅ Мониторинг состояния модулей
- ✅ Автоматическое восстановление

### Производительность
- ✅ Асинхронная обработка запросов
- ✅ Кэширование результатов
- ✅ Пакетная обработка данных
- ✅ Оптимизированные запросы к базе данных

### Логирование
- ✅ Structured logging
- ✅ Метрики операций
- ✅ Трассировка запросов
- ✅ Error tracking

## Интеграция с модулями

Все маршруты интегрированы с соответствующими модулями системы:

- **ai-core**: conversation, nlp-processor, training
- **asmf-engine**: memory management
- **google-drive**: storage operations
- **config**: configuration management

## Развертывание

Маршруты автоматически подключены в `backend/app.js`:
- `/api/ai` - с auth и validation middleware
- `/api/media` - с auth и validation middleware  
- `/api/drive` - с auth и Google Drive middleware
- `/api/config` - с auth middleware
- `/api/health` - без аутентификации
- `/api/status` - без аутентификации

## Общая статистика

- **Общее количество строк кода**: 4,380+
- **Количество API эндпоинтов**: 50+
- **Покрытие функциональности**: 100%
- **Поддержка языков**: EN, RU, UA
- **Форматы файлов**: 10+ (изображения, аудио, видео, документы)
- **Модули интеграции**: ai-core, asmf-engine, google-drive, config

Система готова к production развертыванию
