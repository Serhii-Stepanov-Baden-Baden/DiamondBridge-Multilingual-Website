# DiamondBridge Backend

Мощный backend для интеграции AI сервисов, обработки медиа, работы с Google Drive и системы уведомлений.

## 🚀 Возможности

### AI Сервисы
- **Интеграция с OpenAI** - GPT-4, ChatGPT, Embeddings, Vision API
- **Интеграция с Anthropic** - Claude-3, Claude-2, Claude Instant  
- **Интеграция с Google AI** - Gemini, PaLM, Text-to-Speech
- **Универсальный API** для работы с любым AI провайдером
- **Сравнение ответов** от разных AI моделей
- **Анализ изображений** с помощью Vision API

### Обработка Медиа
- **Обработка изображений** - изменение размера, формат, качество, фильтры
- **Создание миниатюр** автоматически
- **Обработка видео** - сжатие, изменение разрешения, извлечение кадров
- **Обработка аудио** - конвертация, изменение качества, регулировка громкости
- **OCR (распознавание текста)** из изображений
- **Speech-to-Text** с поддержкой множества языков
- **Text-to-Speech** с различными голосами

### Google Drive
- **Загрузка и скачивание** файлов
- **Создание папок** и организация файлов
- **Поиск и фильтрация** файлов
- **Предоставление доступа** и управление разрешениями
- **Экспорт** Google Docs в различные форматы
- **Резервное копирование** папок
- **Синхронизация** с локальными файлами

### Система Уведомлений
- **Email уведомления** через SMTP
- **SMS уведомления** через Twilio
- **Push уведомления** через Web Push API
- **Firebase Cloud Messaging** для мобильных устройств
- **Внутренние уведомления** для веб-приложения
- **Шаблонизация** сообщений с переменными
- **Отложенные уведомления** и массовые рассылки

## 📦 Установка

### Требования
- Node.js 16.0+
- MongoDB 5.0+
- Redis 6.0+
- FFmpeg (для обработки видео/аудио)

### Быстрый старт

1. **Клонирование репозитория**
```bash
git clone https://github.com/diamondbridge/backend.git
cd backend
```

2. **Установка зависимостей**
```bash
npm install
```

3. **Настройка переменных окружения**
```bash
cp .env.example .env
# Отредактируйте .env файл с вашими настройками
```

4. **Запуск в development**
```bash
npm run dev
```

5. **Запуск в production**
```bash
npm start
```

## 🔧 Конфигурация

### AI Сервисы

#### OpenAI
```javascript
// Настройки в .env
OPENAI_API_KEY=sk-your-api-key-here
```

#### Anthropic
```javascript
// Настройки в .env
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
```

#### Google AI
```javascript
// Настройки в .env
GOOGLE_AI_API_KEY=your-google-ai-key-here
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_CLIENT_EMAIL=your-service@project.iam.gserviceaccount.com
```

### Google Drive

```javascript
// Настройки в .env
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./config/service-account-key.json
GOOGLE_DRIVE_ROOT_FOLDER_ID=your-folder-id
```

### Уведомления

#### Email (SMTP)
```javascript
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### Push Notifications
```javascript
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
```

#### SMS (Twilio)
```javascript
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

## 📚 Использование Сервисов

### AI Service

```javascript
const aiService = require('./services/ai-service');

// Генерация текста
const result = await aiService.generateText({
  prompt: 'Напиши стихотворение о природе',
  provider: 'openai', // 'anthropic' или 'google'
  options: {
    model: 'gpt-4',
    maxTokens: 1000,
    temperature: 0.7
  }
});

// Создание embedding
const embedding = await aiService.createEmbedding('Текст для embeddings');

// Анализ изображения
const analysis = await aiService.analyzeImage(
  imageBuffer, 
  'Опишите это изображение'
);

// Сравнение провайдеров
const comparison = await aiService.compareProviders(
  'Объясни квантовую физику простыми словами',
  ['openai', 'anthropic', 'google']
);
```

### Media Service

```javascript
const mediaService = require('./services/media-service');

// Обработка изображения
const processedImage = await mediaService.processImage(
  inputPath,
  outputPath,
  {
    width: 800,
    height: 600,
    format: 'jpeg',
    quality: 85,
    fit: 'cover'
  }
);

// Создание миниатюры
const thumbnail = await mediaService.createThumbnail(
  inputPath,
  outputPath,
  300
);

// Обработка видео
const processedVideo = await mediaService.processVideo(
  inputPath,
  outputPath,
  {
    width: 1920,
    height: 1080,
    bitrate: '2000k',
    codec: 'libx264'
  }
);

// OCR распознавание текста
const text = await mediaService.extractTextFromImage(imagePath);

// Speech-to-Text
const transcription = await mediaService.speechToText(audioPath);

// Text-to-Speech
const audioFile = await mediaService.textToSpeech(
  'Привет, как дела?',
  outputPath,
  {
    languageCode: 'ru-RU',
    voice: 'ru-RU-Standard-A'
  }
);
```

### Drive Service

```javascript
const driveService = require('./services/drive-service');

// Загрузка файла
const fileInfo = await driveService.uploadFile(filePath, {
  folderId: 'your-folder-id',
  description: 'Мой файл'
});

// Загрузка множества файлов
const results = await driveService.uploadMultipleFiles([
  { path: 'file1.pdf', options: { folderId: 'folder1' } },
  { path: 'file2.jpg', options: { folderId: 'folder2' } }
]);

// Скачивание файла
const downloadedFile = await driveService.downloadFile(fileId, localPath);

// Получение списка файлов
const { files } = await driveService.listFiles(folderId);

// Поиск файлов
const searchResults = await driveService.searchFiles('отчет', {
  mimeType: 'application/pdf',
  createdTime: '2023-01-01'
});

// Предоставление доступа
await driveService.shareFile(fileId, 'user@example.com', 'reader');

// Экспорт Google Docs
const exportedContent = await driveService.exportFile(
  documentId, 
  'application/pdf'
);

// Создание резервной копии
const backup = await driveService.createFolderBackup(
  sourceFolderId,
  'backup-2023-12-01',
  backupFolderId
);
```

### Notification Service

```javascript
const notificationService = require('./services/notification-service');

// Отправка email
await notificationService.send({
  type: 'email',
  recipients: ['user@example.com'],
  template: 'email:welcome',
  data: {
    userName: 'Иван',
    appName: 'DiamondBridge'
  }
});

// Отправка SMS
await notificationService.send({
  type: 'sms',
  recipients: ['+1234567890'],
  template: 'sms:verification',
  data: {
    code: '123456',
    expirationTime: '10 минут'
  }
});

// Push уведомления
await notificationService.send({
  type: 'push',
  recipients: ['user-id'],
  template: 'push:new_message',
  data: {
    senderName: 'Анна',
    messagePreview: 'Привет!'
  }
});

// Массовая отправка
await notificationService.sendBulk([
  {
    type: 'email',
    recipients: ['user1@example.com', 'user2@example.com'],
    template: 'email:newsletter',
    data: { title: 'Новые функции' }
  }
]);

// Отложенная отправка
const notificationId = notificationService.scheduleNotification({
  type: 'email',
  recipients: ['user@example.com'],
  template: 'email:reminder',
  data: { message: 'Не забудьте о встрече' }
}, 3600000); // Через час
```

## 📝 API Документация

Полная API документация доступна по адресу `/api-docs` (требует настройки Swagger).

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
- `POST /api/media/speech-to-text` - Речь в текст
- `POST /api/media/text-to-speech` - Текст в речь

#### Google Drive
- `POST /api/drive/upload` - Загрузка файлов
- `GET /api/drive/files` - Список файлов
- `GET /api/drive/search` - Поиск файлов
- `POST /api/drive/share` - Предоставление доступа
- `POST /api/drive/export` - Экспорт файлов

#### Notifications
- `POST /api/notifications/send` - Отправка уведомления
- `POST /api/notifications/bulk` - Массовая отправка
- `GET /api/notifications/user/:id` - Уведомления пользователя
- `POST /api/notifications/read` - Отметка как прочитанное

## 🔒 Безопасность

- **Валидация входных данных** во всех сервисах
- **Обработка ошибок** с логированием
- **Rate limiting** для API endpoints
- **CORS настройки** для веб-приложений
- **Аутентификация JWT** с refresh токенами
- **Шифрование** чувствительных данных
- **Логирование безопасности** всех операций

## 📊 Мониторинг и Логирование

### Структура логов
```
logs/
├── combined.log     # Все логи
├── error.log        # Только ошибки
├── api.log          # HTTP запросы
├── database.log     # Операции БД
├── ai-services.log  # AI операции
├── security.log     # События безопасности
└── performance.log  # Метрики производительности
```

### Просмотр логов
```bash
# Все логи
npm run logs

# Только ошибки
npm run logs:error

# API запросы
npm run logs:api
```

## 🧪 Тестирование

```bash
# Запуск тестов
npm test

# Тесты в watch режиме
npm run test:watch

# Тесты с покрытием
npm run test:coverage
```

## 📈 Масштабирование

### Горизонтальное масштабирование
- **Load Balancer** для распределения нагрузки
- **Session Store** в Redis для shared sessions
- **Message Queue** для асинхронных задач

### Вертикальное масштабирование
- **Connection Pooling** для базы данных
- **Redis Cache** для быстрого доступа к данным
- **CDN** для статических файлов

### Оптимизация производительности
- **Lazy Loading** для больших файлов
- **Async Processing** для тяжелых операций
- **Batch Processing** для множественных операций

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add some AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект лицензирован под MIT License - см. файл [LICENSE](LICENSE) для деталей.

## 🆘 Поддержка

Если у вас есть вопросы или предложения:

- Создайте [Issue](https://github.com/diamondbridge/backend/issues)
- Напишите на [support@yourdomain.com](mailto:support@yourdomain.com)
- Проверьте [документацию](https://docs.yourdomain.com)

---

**DiamondBridge Backend** - Мощная платформа для интеграции AI, медиа обработки и уведомлений 🚀
