# DiamondBridge Backend - Основные файлы

## Структура проекта

Backend система DiamondBridge создана с использованием Node.js, Express.js и современных технологий для обработки AI сервисов.

### Конфигурационные файлы (config/)

#### `config/index.js` - Главная конфигурация
- Объединяет все конфигурации системы
- Настройки сервера, базы данных, JWT, CORS
- Конфигурация Redis, файловых загрузок, логирования
- Лимиты запросов и настройки безопасности
- Конфигурация внешних сервисов (email, SMS)

#### `config/database.js` - Настройки базы данных
- Поддержка PostgreSQL, MySQL, MongoDB
- Конфигурация пула соединений
- Настройки Redis для кеширования
- Конфигурация миграций и резервных копий

#### `config/ai.js` - Конфигурация AI сервисов
- OpenAI (GPT-4, DALL-E, Whisper)
- Claude (Anthropic)
- Google AI (Gemini)
- Локальные AI модели (Ollama)
- Vector базы данных (Pinecone, Weaviate, Qdrant)
- Speech-to-Text и Text-to-Speech
- Генерация изображений
- RAG (Retrieval-Augended Generation) система

#### `config/environment.js` - Переменные окружения
- Валидация обязательных переменных
- Загрузка конфигурации из .env файла
- Настройки для разных окружений (dev, prod)
- Безопасная обработка секретных данных

### Утилиты (utils/)

#### `utils/logger.js` - Система логирования
- Winston-based логирование
- Различные уровни логов (error, warn, info, debug)
- Специализированные логгеры для API, БД, AI, безопасности
- Ротация лог файлов
- Форматирование для русского языка

#### `utils/error-handler.js` - Обработка ошибок
- Пользовательские классы ошибок
- Глобальный обработчик ошибок
- Безопасная обработка в dev/prod режимах
- Graceful shutdown
- Валидация ошибок БД

#### `utils/database.js` - Подключение к базе данных
- Подключение к PostgreSQL/MySQL через Sequelize
- Подключение к Redis
- Определение моделей данных
- Ассоциации между моделями
- Утилиты для работы с Redis

### Middleware

#### `middleware/auth.js` - Аутентификация
- JWT аутентификация
- Проверка ролей и прав доступа
- Управление сессиями
- Валидация email и активности пользователя
- Rate limiting на основе пользователя
- Блокировка при превышении лимитов

#### `middleware/validation.js` - Валидация данных
- Joi-based валидация схем
- Схемы для регистрации, входа, AI запросов
- Валидация файлов и JSON структур
- Санитизация входных данных
- Content-Type проверки

#### `middleware/rate-limit.js` - Ограничение запросов
- Redis-based rate limiting
- Различные лимиты для разных endpoint'ов
- Специальные лимиты для AI сервисов
- Динамические лимиты на основе подписки
- Отслеживание подозрительной активности

#### `middleware/logging.js` - Логирование запросов
- Детальное логирование HTTP запросов
- Отслеживание производительности
- Логирование AI операций
- События безопасности
- Активность пользователей
- WebSocket логирование

## Особенности реализации

### Безопасность
- JWT токены с refresh механизмом
- Rate limiting для защиты от атак
- Валидация и санитизация всех входных данных
- Логирование событий безопасности
- Блокировка подозрительной активности

### Масштабируемость
- Redis для кеширования и сессий
- Конфигурируемые пулы соединений БД
- Горизонтальное масштабирование через stateless архитектуру
- Оптимизированные запросы к БД

### Мониторинг и отладка
- Comprehensive логирование на всех уровнях
- Отслеживание производительности
- Метрики использования AI сервисов
- Error tracking и alerting
- Health check endpoints

### AI Интеграция
- Поддержка множественных AI провайдеров
- Конфигурируемые лимиты и тарификация
- Кеширование AI результатов
- Мониторинг затрат на AI
- Fallback механизмы

## Переменные окружения

Создайте файл `.env` в корне backend директории:

```bash
# Основные настройки
NODE_ENV=development
PORT=3000
JWT_SECRET=your-super-secret-jwt-key

# База данных
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=diamondbridge
DB_USER=postgres
DB_PASSWORD=your-db-password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# AI Сервисы
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GOOGLE_AI_API_KEY=your-google-ai-api-key

# Email
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# SMS
SMS_PROVIDER=twilio
SMS_ACCOUNT_SID=your-twilio-sid
SMS_AUTH_TOKEN=your-twilio-token
SMS_FROM=+1234567890

# Vector Database
VECTOR_DB_PROVIDER=pinecone
VECTOR_DB_API_KEY=your-pinecone-key
VECTOR_DB_ENVIRONMENT=your-environment
```

## Запуск системы

1. Установите зависимости:
```bash
npm install
```

2. Настройте переменные окружения в `.env`

3. Инициализируйте базу данных:
```bash
npm run db:migrate
npm run db:seed
```

4. Запустите сервер:
```bash
npm start
```

Все файлы готовы к использованию и содержат полную функциональность для production-ready backend системы DiamondBridge.
