# Архитектура Backend системы DiamondBridge

## Обзор архитектуры

Backend система DiamondBridge построена по модульной архитектуре с разделением ответственности между компонентами. Основные модули:

- **ai-core**: Центральный модуль для работы с AI сервисами
- **asmf-engine**: Движок обработки и анализа медиа-контента
- **google-drive**: Модуль интеграции с Google Drive API
- **config**: Система конфигурации и управления настройками

## Структура проекта

```
backend/
├── package.json              # Зависимости и скрипты
├── app.js                    # Главный файл приложения (ТОЧКА ВХОДА)
├── config/                   # Конфигурационный модуль
│   ├── index.js             # Основная конфигурация
│   ├── database.js          # Настройки БД
│   ├── ai.js                # Конфигурация AI сервисов
│   └── environment.js       # Переменные окружения
├── ai-core/                 # AI модуль
│   ├── index.js             # Главный файл AI модуля
│   ├── providers/           # Провайдеры AI сервисов
│   │   ├── openai.js        # OpenAI интеграция
│   │   ├── anthropic.js     # Anthropic Claude
│   │   └── google-ai.js     # Google AI (Gemini)
│   ├── models/              # Модели и схемы данных
│   │   ├── request.js       # Схема запроса к AI
│   │   └── response.js      # Схема ответа от AI
│   └── utils/               # Утилиты AI
│       ├── prompt-builder.js
│       └── response-parser.js
├── asmf-engine/             # Движок обработки медиа
│   ├── index.js             # Главный файл движка
│   ├── processors/          # Процессоры медиа
│   │   ├── image-processor.js
│   │   ├── video-processor.js
│   │   └── audio-processor.js
│   ├── analyzers/           # Анализаторы контента
│   │   ├── content-analyzer.js
│   │   ├── structure-analyzer.js
│   │   └── quality-analyzer.js
│   └── extractors/          # Экстракторы данных
│       ├── metadata-extractor.js
│       └── text-extractor.js
├── google-drive/            # Google Drive интеграция
│   ├── index.js             # Главный файл GDrive модуля
│   ├── api/                 # Google Drive API
│   │   ├── client.js        # Клиент Google Drive
│   │   ├── files.js         # Операции с файлами
│   │   └── permissions.js   # Управление доступом
│   ├── auth/                # Аутентификация
│   │   ├── oauth.js         # OAuth 2.0
│   │   └── service-account.js
│   └── sync/                # Синхронизация
│       ├── file-sync.js
│       └── change-detector.js
├── routes/                  # API маршруты
│   ├── ai.js                # AI эндпоинты
│   ├── media.js             # Медиа операции
│   ├── drive.js             # Google Drive эндпоинты
│   └── config.js            # Конфигурационные эндпоинты
├── middleware/              # Промежуточное ПО
│   ├── auth.js              # Аутентификация
│   ├── validation.js        # Валидация данных
│   ├── rate-limit.js        # Ограничение запросов
│   └── logging.js           # Логирование
├── services/                # Бизнес-логика
│   ├── ai-service.js        # Сервис AI операций
│   ├── media-service.js     # Сервис медиа обработки
│   ├── drive-service.js     # Сервис Google Drive
│   └── notification-service.js
└── utils/                   # Общие утилиты
    ├── logger.js            # Система логирования
    ├── error-handler.js     # Обработка ошибок
    └── database.js          # Подключение к БД
```

## Технологический стек

### Основные технологии:
- **Node.js** (v18+): Основная платформа
- **Express.js**: Web фреймворк
- **TypeScript**: Для типизации (опционально)

### Зависимости:

#### Основные:
```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "helmet": "^7.1.0",
  "dotenv": "^16.3.1",
  "winston": "^3.11.0"
}
```

#### AI интеграция:
```json
{
  "openai": "^4.20.0",
  "@anthropic-ai/sdk": "^0.9.1",
  "@google/generative-ai": "^0.2.1"
}
```

#### Google Drive:
```json
{
  "googleapis": "^128.0.0",
  "google-auth-library": "^9.4.0"
}
```

#### База данных:
```json
{
  "prisma": "^5.7.0",
  "@prisma/client": "^5.7.0"
}
```

#### Медиа обработка:
```json
{
  "sharp": "^0.33.0",
  "ffmpeg-static": "^5.2.0",
  "fluent-ffmpeg": "^2.1.2"
}
```

#### Валидация и безопасность:
```json
{
  "joi": "^17.11.0",
  "express-rate-limit": "^7.1.5",
  "express-validator": "^7.0.1"
}
```

## Архитектурные принципы

### 1. Модульная структура
Каждый модуль имеет четко определенные границы ответственности и может быть разработан/тестирован независимо.

### 2. Dependency Injection
Использование DI для обеспечения тестируемости и гибкости архитектуры.

### 3. Middleware архитектура
Цепочка промежуточного ПО для обработки запросов.

### 4. Сервисный слой
Разделение бизнес-логики от контроллеров.

## Детальное описание модулей

### config/ - Система конфигурации
```javascript
// config/index.js
const config = {
  environment: process.env.NODE_ENV || 'development',
  
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || 'localhost',
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true
    }
  },
  
  database: {
    url: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production'
  },
  
  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4',
      maxTokens: 4000
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: 'claude-3-sonnet-20240229'
    },
    google: {
      apiKey: process.env.GOOGLE_AI_API_KEY,
      model: 'gemini-pro'
    }
  },
  
  googleDrive: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'combined'
  }
};

module.exports = config;
```

### ai-core/ - AI модуль
```javascript
// ai-core/index.js
const { OpenAIProvider } = require('./providers/openai');
const { AnthropicProvider } = require('./providers/anthropic');
const { GoogleAIProvider } = require('./providers/google-ai');

class AICore {
  constructor(config) {
    this.providers = {
      openai: new OpenAIProvider(config.ai.openai),
      anthropic: new AnthropicProvider(config.ai.anthropic),
      google: new GoogleAIProvider(config.ai.google)
    };
  }

  async generateContent(provider, prompt, options = {}) {
    const aiProvider = this.providers[provider];
    if (!aiProvider) {
      throw new Error(`AI provider ${provider} not found`);
    }
    
    return await aiProvider.generate(prompt, options);
  }

  async analyzeContent(provider, content, analysisType) {
    const aiProvider = this.providers[provider];
    return await aiProvider.analyze(content, analysisType);
  }
}

module.exports = AICore;
```

### asmf-engine/ - Движок обработки медиа
```javascript
// asmf-engine/index.js
const ImageProcessor = require('./processors/image-processor');
const VideoProcessor = require('./processors/video-processor');
const AudioProcessor = require('./processors/audio-processor');
const ContentAnalyzer = require('./analyzers/content-analyzer');

class ASMFEngine {
  constructor() {
    this.processors = {
      image: new ImageProcessor(),
      video: new VideoProcessor(),
      audio: new AudioProcessor()
    };
    this.analyzer = new ContentAnalyzer();
  }

  async processMedia(filePath, mediaType, options = {}) {
    const processor = this.processors[mediaType];
    if (!processor) {
      throw new Error(`Processor for ${mediaType} not found`);
    }

    const processedData = await processor.process(filePath, options);
    const analysis = await this.analyzer.analyze(processedData);
    
    return {
      ...processedData,
      analysis
    };
  }

  async extractMetadata(filePath, mediaType) {
    const processor = this.processors[mediaType];
    return await processor.extractMetadata(filePath);
  }
}

module.exports = ASMFEngine;
```

### google-drive/ - Google Drive интеграция
```javascript
// google-drive/index.js
const { GoogleDriveClient } = require('./api/client');
const OAuthManager = require('./auth/oauth');
const FileSync = require('./sync/file-sync');

class GoogleDriveIntegration {
  constructor(config) {
    this.client = new GoogleDriveClient(config.googleDrive);
    this.oauth = new OAuthManager(config.googleDrive);
    this.sync = new FileSync(this.client);
  }

  async authenticate(authCode) {
    return await this.oauth.getAccessToken(authCode);
  }

  async uploadFile(filePath, options = {}) {
    return await this.client.uploadFile(filePath, options);
  }

  async downloadFile(fileId, destination) {
    return await this.client.downloadFile(fileId, destination);
  }

  async syncFiles(direction = 'both') {
    return await this.sync.syncFiles(direction);
  }
}

module.exports = GoogleDriveIntegration;
```

## Рекомендации по созданию app.js

### Основная структура app.js:

```javascript
// app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const winston = require('winston');

// Загрузка переменных окружения
dotenv.config();

// Импорт конфигурации и модулей
const config = require('./config');
const { errorHandler } = require('./utils/error-handler');
const { setupLogging } = require('./utils/logger');
const AICore = require('./ai-core');
const ASMFEngine = require('./asmf-engine');
const GoogleDriveIntegration = require('./google-drive');

// Инициализация приложения
const app = express();
const PORT = config.server.port;

// Настройка логирования
const logger = setupLogging(config.logging);

// Безопасность
app.use(helmet());
app.use(cors(config.server.cors));

// Парсинг запросов
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Инициализация модулей
const aiCore = new AICore(config);
const asmfEngine = new ASMFEngine();
const googleDrive = new GoogleDriveIntegration(config);

// Подключение маршрутов
app.use('/api/ai', require('./routes/ai'));
app.use('/api/media', require('./routes/media'));
app.use('/api/drive', require('./routes/drive'));
app.use('/api/config', require('./routes/config'));

// Обработка ошибок
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Запуск сервера
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

module.exports = app;
```

### Дополнительные рекомендации для app.js:

#### 1. Обработка ошибок и логирование:
```javascript
// middleware/error-handler.js
const winston = require('winston');

const errorHandler = (err, req, res, next) => {
  const logger = winston.createLogger({
    level: 'error',
    format: winston.format.json(),
    transports: [
      new winston.transports.File({ filename: 'logs/error.log' })
    ]
  });

  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  res.status(err.statusCode || 500).json({
    error: {
      message: err.message,
      statusCode: err.statusCode || 500
    }
  });
};

module.exports = { errorHandler };
```

#### 2. Валидация входящих данных:
```javascript
// middleware/validation.js
const { validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

module.exports = { validateRequest };
```

#### 3. Rate limiting:
```javascript
// middleware/rate-limit.js
const rateLimit = require('express-rate-limit');

const createRateLimit = (windowMs, max) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too many requests, please try again later'
    }
  });
};

module.exports = { createRateLimit };
```

## Зависимости и их взаимодействие

### Диаграмма зависимостей:
```
app.js
├── config/ (конфигурация)
├── ai-core/ → ai-core зависит от OpenAI/Anthropic/Google AI API
├── asmf-engine/ → asmf-engine зависит от sharp, ffmpeg
├── google-drive/ → зависит от googleapis
├── routes/ → зависят от всех модулей
├── middleware/ → независимые
├── services/ → зависят от модулей
└── utils/ → независимые
```

### Интеграция модулей:
1. **AI-Core** используется в `media-service` для анализа медиа
2. **ASMF-Engine** интегрируется с **AI-Core** для умного анализа контента
3. **Google-Drive** синхронизируется с **ASMF-Engine** для обработки загруженных файлов
4. **Config** предоставляет конфигурацию всем модулям

## Безопасность и масштабирование

### Меры безопасности:
- Helmet для заголовков безопасности
- CORS настройки
- Rate limiting
- Валидация входных данных
- Логирование всех операций
- Обработка ошибок без раскрытия внутренней информации

### Масштабирование:
- Модульная архитектура позволяет горизонтальное масштабирование
- Использование Redis для кэширования
- Очереди для тяжелых операций (Bull/BullMQ)
- База данных с репликацией

## Рекомендуемые улучшения

1. **Кэширование**: Добавить Redis для кэширования AI запросов
2. **Очереди**: Внедрить Bull для обработки медиа в фоне
3. **Мониторинг**: Добавить Prometheus и Grafana
4. **Тестирование**: Комплексное тестирование всех модулей
5. **Документация**: OpenAPI/Swagger для API
6. **CI/CD**: Автоматическое развертывание

Эта архитектура обеспечивает гибкость, масштабируемость и простоту поддержки backend системы DiamondBridge.

## Анализ зависимостей Frontend

### Frontend технологический стек:
- **React 18.3.1**: Основной UI фреймворк
- **TypeScript**: Типизация (компилируется в JS)
- **Vite**: Сборщик и dev сервер
- **TailwindCSS**: CSS фреймворк
- **Radix UI**: Компоненты низкого уровня
- **React Router DOM**: Маршрутизация
- **React Hook Form**: Управление формами
- **Recharts**: Библиотека графиков

### Интеграция Frontend ↔ Backend

#### API клиент для Frontend:
```javascript
// src/lib/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class APIClient {
  private baseURL: string;
  
  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // AI endpoints
  async generateContent(prompt: string, provider: string) {
    return this.request('/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt, provider })
    });
  }

  // Media endpoints  
  async uploadMedia(file: File, mediaType: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mediaType', mediaType);

    return this.request('/api/media/upload', {
      method: 'POST',
      body: formData
    });
  }

  // Google Drive endpoints
  async syncWithDrive() {
    return this.request('/api/drive/sync', { method: 'POST' });
  }
}

export const apiClient = new APIClient();
```

#### Типы TypeScript для Frontend:
```typescript
// src/types/api.ts
export interface AIRequest {
  prompt: string;
  provider: 'openai' | 'anthropic' | 'google';
  options?: {
    maxTokens?: number;
    temperature?: number;
  };
}

export interface MediaProcessRequest {
  file: File;
  mediaType: 'image' | 'video' | 'audio';
  options?: {
    extractText?: boolean;
    analyzeContent?: boolean;
  };
}

export interface GoogleDriveSyncRequest {
  direction: 'upload' | 'download' | 'both';
  fileId?: string;
  localPath?: string;
}
```

## Полная архитектура системы

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   External      │
│   (React)       │◄──►│   (Node.js)     │◄──►│   Services      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • React 18      │    │ • Express.js    │    │ • OpenAI API    │
│ • TypeScript    │    │ • AI Core       │    │ • Anthropic API │
│ • TailwindCSS   │    │ • ASMF Engine   │    │ • Google AI     │
│ • React Router  │    │ • Google Drive  │    │ • Google Drive  │
│ • React Hooks   │    │ • Config        │    │ • Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Поток данных:
1. **Frontend** отправляет запросы к **Backend** API
2. **Backend** обрабатывает запросы и делегирует соответствующим модулям:
   - AI запросы → **ai-core**
   - Медиа обработка → **asmf-engine** 
   - Файловые операции → **google-drive**
3. **Backend** интегрируется с **внешними сервисами**
4. **Frontend** получает обработанные данные и обновляет UI

Эта архитектура обеспечивает четкое разделение ответственности между frontend и backend, позволяя каждой части развиваться независимо при сохранении совместимости через четко определенный API контракт.