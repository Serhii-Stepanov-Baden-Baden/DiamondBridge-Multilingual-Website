# DiamondBridge - Многоязычная AI Платформа

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)

DiamondBridge - это мощная многоязычная платформа для интеграции искусственного интеллекта, обработки медиа и управления документами. Платформа предоставляет универсальный API для работы с различными AI провайдерами, систему обработки медиафайлов и интеграцию с Google Drive.

## 🚀 Ключевые Возможности

### 🤖 AI Интеграция
- **Мульти-провайдер AI** - поддержка OpenAI, Anthropic, Google AI
- **Генерация текста** - GPT-4, Claude-3, Gemini
- **Анализ изображений** - Vision API для анализа картинок
- **Создание Embeddings** - векторные представления текста
- **Речь в текст** - распознавание речи на множестве языков
- **Текст в речь** - синтез речи с различными голосами
- **Сравнение AI** - анализ ответов от разных провайдеров

### 🖼️ Обработка Медиа
- **Изображения** - изменение размера, формат, качество
- **Видео** - сжатие, конвертация, извлечение кадров  
- **Аудио** - конвертация, нормализация, обработка
- **OCR** - распознавание текста из изображений
- **Миниатюры** - автоматическое создание превью

### ☁️ Google Drive Интеграция
- **Загрузка/скачивание** файлов
- **Поиск и фильтрация** документов
- **Предоставление доступа** и управление правами
- **Экспорт** Google Docs в различные форматы
- **Резервное копирование** папок и файлов
- **Синхронизация** с локальными файлами

### 🔔 Система Уведомлений
- **Email** через SMTP
- **SMS** через Twilio
- **Push уведомления** через Web Push API
- **Firebase Cloud Messaging**
- **Шаблонизация** сообщений
- **Массовые рассылки** и отложенная отправка

## 🏗️ Архитектура

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   External      │
│  React + TS     │◄──►│  Node.js API    │◄──►│   Services      │
│  Vite + Tailwind│    │  Express        │    │                 │
│  Multilingual   │    │  Socket.io      │    │ • OpenAI        │
│  PWA Ready      │    │  Redis Cache    │    │ • Anthropic     │
│                 │    │  MongoDB        │    │ • Google AI     │
│                 │    │  Socket.io      │    │ • Google Drive  │
└─────────────────┘    └─────────────────┘    │ • Twilio        │
                                              │ • SMTP/Push     │
                                              └─────────────────┘
         ▲                                            ▲
         │                                            │
         ▼                                            ▼
┌─────────────────┐                          ┌─────────────────┐
│  Browser        │                          │   Media         │
│  Automation     │                          │  Processing     │
│  Python +       │                          │  FFmpeg         │
│  Selenium       │                          │  Sharp          │
│  Web Scraping   │                          │  Tesseract      │
└─────────────────┘                          └─────────────────┘
```

### 📁 Структура Проекта

```
diamondbridge/
├── 📁 backend/              # Node.js API сервер
│   ├── 📁 config/           # Конфигурация
│   ├── 📁 routes/           # API маршруты
│   ├── 📁 services/         # Бизнес-логика
│   ├── 📁 middleware/       # Express middleware
│   └── 📁 utils/            # Вспомогательные функции
├── 📁 diamondbridge-multilingual/  # React фронтенд
│   ├── 📁 src/
│   │   ├── 📁 components/   # React компоненты
│   │   ├── 📁 hooks/        # Пользовательские хуки
│   │   ├── 📁 i18n/         # Интернационализация
│   │   └── 📁 lib/          # Утилиты
│   └── 📁 public/           # Статические файлы
├── 📁 browser/              # Автоматизация браузера
│   ├── 📁 global_browser.py # Основной скрипт
│   └── 📁 browser_extension/# Браузерные расширения
├── 📁 docs/                 # Документация
└── 📄 DEPLOYMENT.md         # Инструкции развертывания
```

## 🚀 Быстрый Старт

### Предварительные Требования

- **Node.js** 16.0+ 
- **npm** 8.0+ или **pnpm** 8.0+
- **MongoDB** 5.0+
- **Redis** 6.0+
- **FFmpeg** (для обработки медиа)

### Установка и Запуск

1. **Клонирование репозитория**
```bash
git clone https://github.com/your-org/diamondbridge.git
cd diamondbridge
```

2. **Установка Backend зависимостей**
```bash
cd backend
npm install
```

3. **Установка Frontend зависимостей**
```bash
cd ../diamondbridge-multilingual  
pnpm install
```

4. **Настройка переменных окружения**

Backend (.env):
```bash
# AI Services
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_AI_API_KEY=your-google-ai-key

# Database
MONGODB_URI=mongodb://localhost:27017/diamondbridge
REDIS_URL=redis://localhost:6379

# Google Drive
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./config/service-account-key.json

# Notifications
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token

# Security
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
```

5. **Запуск Backend**
```bash
cd backend
npm run dev
```

6. **Запуск Frontend** (в новом терминале)
```bash
cd diamondbridge-multilingual
pnpm dev
```

7. **Открыть приложение**
```
Frontend: http://localhost:5173
Backend API: http://localhost:3000
API Docs: http://localhost:3000/api-docs
```

## 💻 Использование

### API Примеры

#### AI Генерация текста
```javascript
const response = await fetch('/api/ai/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Напиши стихотворение о природе',
    provider: 'openai',
    options: {
      model: 'gpt-4',
      maxTokens: 1000,
      temperature: 0.7
    }
  })
});
```

#### Обработка изображения
```javascript
const formData = new FormData();
formData.append('image', file);
formData.append('action', 'resize');
formData.append('width', '800');
formData.append('height', '600');

const response = await fetch('/api/media/image/process', {
  method: 'POST',
  body: formData
});
```

#### Загрузка в Google Drive
```javascript
const formData = new FormData();
formData.append('file', file);
formData.append('folderId', 'your-folder-id');

const response = await fetch('/api/drive/upload', {
  method: 'POST',
  body: formData
});
```

### Frontend Компоненты

#### Многоязычная поддержка
```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t, i18n } = useTranslation();
  
  return (
    <div>
      <h1>{t('welcome.title')}</h1>
      <button onClick={() => i18n.changeLanguage('en')}>
        {t('language.english')}
      </button>
    </div>
  );
}
```

#### AI Интерфейс
```typescript
import { useAI } from '@/hooks/useAI';

function AIChat() {
  const { generate, isLoading } = useAI();
  
  const handleGenerate = async () => {
    const result = await generate({
      prompt: 'Объясни квантовую физику',
      provider: 'openai'
    });
    console.log(result);
  };
  
  return (
    <button onClick={handleGenerate} disabled={isLoading}>
      {isLoading ? 'Генерация...' : 'Спросить AI'}
    </button>
  );
}
```

## 🧪 Тестирование

### Backend Тесты
```bash
cd backend
npm test                    # Все тесты
npm run test:watch         # Watch режим  
npm run test:coverage      # С покрытием
```

### Frontend Тесты
```bash
cd diamondbridge-multilingual
pnpm test                  # Все тесты
pnpm test:ui              # UI режим
pnpm test:coverage        # С покрытием
```

## 📊 Мониторинг

### Логи Backend
```bash
cd backend
npm run logs              # Все логи
npm run logs:error        # Только ошибки
npm run logs:api          # API запросы
```

### Метрики
- **Health Check**: `GET /api/health`
- **Status**: `GET /api/status`
- **Metrics**: `GET /api/metrics` (требует аутентификации)

## 🚢 Развертывание

Подробные инструкции по развертыванию см. в [DEPLOYMENT.md](DEPLOYMENT.md)

### Быстрое развертывание с Docker
```bash
# Backend
cd backend
docker build -t diamondbridge-backend .
docker run -p 3000:3000 diamondbridge-backend

# Frontend
cd diamondbridge-multilingual
docker build -t diamondbridge-frontend .
docker run -p 80:80 diamondbridge-frontend
```

## 🤝 Вклад в Разработку

Мы приветствуем вклад в развитие проекта! Пожалуйста, ознакомьтесь с [CONTRIBUTING.md](CONTRIBUTING.md) для получения подробной информации о том, как участвовать в разработке.

### Процесс разработки

1. **Fork** репозитория
2. **Создайте feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit изменения** (`git commit -m 'Add some AmazingFeature'`)
4. **Push в branch** (`git push origin feature/AmazingFeature`)
5. **Откройте Pull Request**

### Стандарты кода

- **Backend**: ESLint + Prettier
- **Frontend**: TypeScript + ESLint
- **Коммиты**: Conventional Commits
- **Тесты**: Jest + React Testing Library

## 📝 API Документация

Полная API документация доступна по адресу:
- **Swagger UI**: `http://localhost:3000/api-docs` (в development)
- **OpenAPI Spec**: `http://localhost:3000/api-docs-json`

### Основные эндпоинты

#### AI Operations
- `POST /api/ai/generate` - Генерация текста
- `POST /api/ai/embed` - Создание embeddings
- `POST /api/ai/vision` - Анализ изображений
- `POST /api/ai/compare` - Сравнение AI провайдеров

#### Media Processing
- `POST /api/media/image/resize` - Изменение размера изображения
- `POST /api/media/video/process` - Обработка видео
- `POST /api/media/audio/convert` - Конвертация аудио
- `POST /api/media/ocr` - OCR распознавание

#### Google Drive
- `POST /api/drive/upload` - Загрузка файлов
- `GET /api/drive/files` - Список файлов
- `GET /api/drive/search` - Поиск файлов
- `POST /api/drive/share` - Предоставление доступа

## 🔒 Безопасность

- **Аутентификация JWT** с refresh токенами
- **Валидация входных данных** во всех endpoint'ах
- **Rate limiting** для предотвращения злоупотреблений
- **CORS настройки** для безопасных междоменных запросов
- **Шифрование** чувствительных данных
- **Логирование безопасности** всех операций
- **Регулярные обновления** зависимостей

## 📈 Производительность

### Backend оптимизации
- **Connection Pooling** для MongoDB
- **Redis Cache** для часто используемых данных
- **Batch Processing** для множественных операций
- **Async/Await** для неблокирующих операций
- **Compression** для HTTP ответов

### Frontend оптимизации
- **Code Splitting** с React.lazy
- **Tree Shaking** для уменьшения бандла
- **Lazy Loading** изображений
- **Service Worker** для кэширования
- **PWA** возможности

## 🌍 Многоязычность

Платформа поддерживает множество языков:
- 🇷🇺 Русский (по умолчанию)
- 🇺🇸 Английский
- 🇩🇪 Немецкий
- 🇫🇷 Французский
- 🇪🇸 Испанский
- 🇮🇹 Итальянский
- 🇯🇵 Японский
- 🇨🇳 Китайский

### Добавление нового языка

1. Создайте файл переводов в `src/i18n/locales/`
2. Добавьте язык в `src/i18n/index.ts`
3. Обновите компонент переключения языков

## 📄 Лицензия

Этот проект лицензирован под MIT License. Подробности в файле [LICENSE](LICENSE).

## 🆘 Поддержка

Если у вас есть вопросы или предложения:

- **Issues**: [GitHub Issues](https://github.com/your-org/diamondbridge/issues)
- **Email**: support@diamondbridge.com
- **Документация**: [https://docs.diamondbridge.com](https://docs.diamondbridge.com)
- **Discord**: [Сервер сообщества](https://discord.gg/diamondbridge)

## 📊 Статистика

![GitHub stars](https://img.shields.io/github/stars/your-org/diamondbridge?style=social)
![GitHub forks](https://img.shields.io/github/forks/your-org/diamondbridge?style=social)
![GitHub issues](https://img.shields.io/github/issues/your-org/diamondbridge)
![GitHub pull requests](https://img.shields.io/github/issues-pr/your-org/diamondbridge)

## 🙏 Благодарности

- [OpenAI](https://openai.com/) за GPT API
- [Anthropic](https://anthropic.com/) за Claude API  
- [Google](https://developers.google.com/ai) за AI и Drive APIs
- [React](https://reactjs.org/) команда за отличный фреймворк
- [Node.js](https://nodejs.org/) сообщество
- Все контрибьюторы проекта

---

**DiamondBridge** - Создано с ❤️ для развития AI технологий

*Версия: 1.0.0* | *Обновлено: Ноябрь 2025*