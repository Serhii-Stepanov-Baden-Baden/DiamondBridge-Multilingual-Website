// Главный файл для работы с переменными окружения
const dotenv = require('dotenv');
const path = require('path');

// Загружаем переменные окружения из .env файла
dotenv.config();

// Валидация обязательных переменных окружения
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'JWT_SECRET',
  'DB_PASSWORD'
];

// Проверяем наличие обязательных переменных
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.warn(`⚠️  Предупреждение: Переменная окружения ${envVar} не установлена`);
  }
});

module.exports = {
  // Основные настройки сервера
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT) || 3000,
  HOST: process.env.HOST || 'localhost',
  
  // База данных
  DB_TYPE: process.env.DB_TYPE || 'postgresql',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || '5432',
  DB_NAME: process.env.DB_NAME || 'diamondbridge',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_SSL: process.env.DB_SSL || 'false',
  DB_SYNC: process.env.DB_SYNC || 'false',
  DB_LOGGING: process.env.DB_LOGGING || 'false',
  DB_POOL_MIN: process.env.DB_POOL_MIN || '2',
  DB_POOL_MAX: process.env.DB_POOL_MAX || '10',
  DB_POOL_ACQUIRE: process.env.DB_POOL_ACQUIRE || '30000',
  DB_POOL_IDLE: process.env.DB_POOL_IDLE || '10000',
  
  // MongoDB (если используется)
  MONGO_URL: process.env.MONGO_URL || 'mongodb://localhost:27017/diamondbridge',
  MONGO_MAX_POOL_SIZE: process.env.MONGO_MAX_POOL_SIZE || '10',
  MONGO_SERVER_TIMEOUT: process.env.MONGO_SERVER_TIMEOUT || '5000',
  MONGO_SOCKET_TIMEOUT: process.env.MONGO_SOCKET_TIMEOUT || '45000',
  
  // Redis
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: process.env.REDIS_PORT || '6379',
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  REDIS_DB: process.env.REDIS_DB || '0',
  REDIS_KEY_PREFIX: process.env.REDIS_KEY_PREFIX || 'diamondbridge:',
  REDIS_TTL: process.env.REDIS_TTL || '3600',
  
  // JWT и безопасность
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  SESSION_SECRET: process.env.SESSION_SECRET,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  BCRYPT_ROUNDS: process.env.BCRYPT_ROUNDS || '12',
  
  // CORS и сетевые настройки
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173',
  
  // Файловая система
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || '10485760', // 10MB
  
  // Логирование
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FORMAT: process.env.LOG_FORMAT || 'combined',
  
  // Ограничение запросов
  RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW || '900000', // 15 минут
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX || '100',
  
  // Email настройки
  EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'gmail',
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@diamondbridge.com',
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT || '587',
  EMAIL_SECURE: process.env.EMAIL_SECURE || 'false',
  
  // SMS настройки
  SMS_PROVIDER: process.env.SMS_PROVIDER || 'twilio',
  SMS_ACCOUNT_SID: process.env.SMS_ACCOUNT_SID,
  SMS_AUTH_TOKEN: process.env.SMS_AUTH_TOKEN,
  SMS_FROM: process.env.SMS_FROM,
  
  // OpenAI
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_ORG_ID: process.env.OPENAI_ORG_ID,
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
  OPENAI_TIMEOUT: process.env.OPENAI_TIMEOUT || '30000',
  OPENAI_MAX_RETRIES: process.env.OPENAI_MAX_RETRIES || '3',
  OPENAI_CHAT_MODEL: process.env.OPENAI_CHAT_MODEL || 'gpt-4',
  OPENAI_EMBEDDING_MODEL: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002',
  OPENAI_VISION_MODEL: process.env.OPENAI_VISION_MODEL || 'gpt-4-vision-preview',
  OPENAI_MODERATION_MODEL: process.env.OPENAI_MODERATION_MODEL || 'text-moderation-stable',
  
  // Claude (Anthropic)
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL,
  CLAUDE_TIMEOUT: process.env.CLAUDE_TIMEOUT || '30000',
  CLAUDE_MAX_TOKENS: process.env.CLAUDE_MAX_TOKENS || '4096',
  CLAUDE3_MODEL: process.env.CLAUDE3_MODEL || 'claude-3-sonnet-20240229',
  CLAUDE2_MODEL: process.env.CLAUDE2_MODEL || 'claude-2.1',
  
  // Google AI
  GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
  GOOGLE_AI_BASE_URL: process.env.GOOGLE_AI_BASE_URL,
  GOOGLE_AI_TIMEOUT: process.env.GOOGLE_AI_TIMEOUT || '30000',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-pro',
  GEMINI_VISION_MODEL: process.env.GEMINI_VISION_MODEL || 'gemini-pro-vision',
  
  // Локальный AI (Ollama)
  LOCAL_AI_ENABLED: process.env.LOCAL_AI_ENABLED || 'false',
  LOCAL_AI_BASE_URL: process.env.LOCAL_AI_BASE_URL || 'http://localhost:11434',
  LOCAL_AI_TIMEOUT: process.env.LOCAL_AI_TIMEOUT || '60000',
  LOCAL_LLM_MODEL: process.env.LOCAL_LLM_MODEL || 'llama2',
  LOCAL_EMBEDDING_MODEL: process.env.LOCAL_EMBEDDING_MODEL || 'nomic-embed-text',
  
  // Vector Database
  VECTOR_DB_PROVIDER: process.env.VECTOR_DB_PROVIDER || 'pinecone',
  VECTOR_DB_API_KEY: process.env.VECTOR_DB_API_KEY,
  VECTOR_DB_ENVIRONMENT: process.env.VECTOR_DB_ENVIRONMENT,
  VECTOR_DB_INDEX: process.env.VECTOR_DB_INDEX || 'diamondbridge-knowledge',
  VECTOR_DB_DIMENSION: process.env.VECTOR_DB_DIMENSION || '1536',
  VECTOR_DB_METRIC: process.env.VECTOR_DB_METRIC || 'cosine',
  
  // Pinecone
  PINECONE_PROJECT_ID: process.env.PINECONE_PROJECT_ID,
  PINECONE_REGION: process.env.PINECONE_REGION || 'us-west1-gcp',
  
  // Weaviate
  WEAVIATE_URL: process.env.WEAVIATE_URL || 'http://localhost:8080',
  WEAVIATE_API_KEY: process.env.WEAVIATE_API_KEY,
  
  // Qdrant
  QDRANT_URL: process.env.QDRANT_URL || 'http://localhost:6333',
  QDRANT_API_KEY: process.env.QDRANT_API_KEY,
  
  // Speech-to-Text
  STT_PROVIDER: process.env.STT_PROVIDER || 'openai',
  STT_MODEL: process.env.STT_MODEL || 'whisper-1',
  STT_LANGUAGE: process.env.STT_LANGUAGE || 'ru',
  GOOGLE_CREDENTIALS: process.env.GOOGLE_CREDENTIALS,
  GOOGLE_STT_LANGUAGE: process.env.GOOGLE_STT_LANGUAGE || 'ru-RU',
  GOOGLE_STT_SAMPLE_RATE: process.env.GOOGLE_STT_SAMPLE_RATE || '16000',
  
  // Text-to-Speech
  TTS_PROVIDER: process.env.TTS_PROVIDER || 'openai',
  TTS_VOICE: process.env.TTS_VOICE || 'alloy',
  TTS_MODEL: process.env.TTS_MODEL || 'tts-1',
  TTS_SPEED: process.env.TTS_SPEED || '1.0',
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
  ELEVENLABS_VOICE_ID: process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM',
  
  // Генерация изображений
  IMAGE_GEN_PROVIDER: process.env.IMAGE_GEN_PROVIDER || 'openai',
  IMAGE_GEN_MODEL: process.env.IMAGE_GEN_MODEL || 'dall-e-3',
  IMAGE_GEN_SIZE: process.env.IMAGE_GEN_SIZE || '1024x1024',
  IMAGE_GEN_QUALITY: process.env.IMAGE_GEN_QUALITY || 'hd',
  STABILITY_API_KEY: process.env.STABILITY_API_KEY,
  STABILITY_STEPS: process.env.STABILITY_STEPS || '30',
  STABILITY_CFG_SCALE: process.env.STABILITY_CFG_SCALE || '7',
  
  // Обработка документов
  DOCUMENT_PROCESSING_ENABLED: process.env.DOCUMENT_PROCESSING_ENABLED || 'true',
  MAX_DOCUMENT_SIZE: process.env.MAX_DOCUMENT_SIZE || '52428800', // 50MB
  OCR_PROVIDER: process.env.OCR_PROVIDER || 'tesseract',
  OCR_LANGUAGE: process.env.OCR_LANGUAGE || 'rus+eng',
  CHUNK_SIZE: process.env.CHUNK_SIZE || '1000',
  CHUNK_OVERLAP: process.env.CHUNK_OVERLAP || '200',
  
  // RAG
  RAG_ENABLED: process.env.RAG_ENABLED || 'true',
  RAG_TOP_K: process.env.RAG_TOP_K || '5',
  RAG_SIMILARITY_THRESHOLD: process.env.RAG_SIMILARITY_THRESHOLD || '0.7',
  RAG_MAX_CONTEXT_LENGTH: process.env.RAG_MAX_CONTEXT_LENGTH || '4000',
  RAG_PROMPT_TEMPLATE: process.env.RAG_PROMPT_TEMPLATE,
  
  // AI агенты
  AI_AGENTS_ENABLED: process.env.AI_AGENTS_ENABLED || 'true',
  AI_MAX_CONCURRENT: process.env.AI_MAX_CONCURRENT || '5',
  AI_AGENT_TIMEOUT: process.env.AI_AGENT_TIMEOUT || '30000',
  AI_MEMORY_LIMIT: process.env.AI_MEMORY_LIMIT || '100',
  CHATBOT_MODEL: process.env.CHATBOT_MODEL || 'gpt-4',
  CHATBOT_TEMPERATURE: process.env.CHATBOT_TEMPERATURE || '0.7',
  CHATBOT_MAX_TOKENS: process.env.CHATBOT_MAX_TOKENS || '2000',
  ASSISTANT_MODEL: process.env.ASSISTANT_MODEL || 'gpt-4',
  ASSISTANT_TEMPERATURE: process.env.ASSISTANT_TEMPERATURE || '0.3',
  ASSISTANT_MAX_TOKENS: process.env.ASSISTANT_MAX_TOKENS || '4000',
  TRANSLATOR_MODEL: process.env.TRANSLATOR_MODEL || 'gpt-3.5-turbo',
  TRANSLATOR_TEMPERATURE: process.env.TRANSLATOR_TEMPERATURE || '0.1',
  
  // Ограничения AI сервисов
  AI_REQUESTS_PER_MINUTE: process.env.AI_REQUESTS_PER_MINUTE || '60',
  AI_REQUESTS_PER_HOUR: process.env.AI_REQUESTS_PER_HOUR || '1000',
  AI_BURST_LIMIT: process.env.AI_BURST_LIMIT || '10',
  
  // Кеширование AI
  AI_CACHE_ENABLED: process.env.AI_CACHE_ENABLED || 'true',
  AI_CACHE_TTL: process.env.AI_CACHE_TTL || '3600',
  AI_CACHE_MAX_SIZE: process.env.AI_CACHE_MAX_SIZE || '1000',
  
  // Мониторинг AI
  AI_MONITORING_ENABLED: process.env.AI_MONITORING_ENABLED || 'true',
  AI_TRACK_USAGE: process.env.AI_TRACK_USAGE || 'true',
  AI_TRACK_COSTS: process.env.AI_TRACK_COSTS || 'true',
  AI_TRACK_PERFORMANCE: process.env.AI_TRACK_PERFORMANCE || 'true',
  
  // Функции системы
  ENABLE_REGISTRATION: process.env.ENABLE_REGISTRATION || 'true',
  ENABLE_EMAIL_VERIFICATION: process.env.ENABLE_EMAIL_VERIFICATION || 'true',
  ENABLE_SOCIAL_AUTH: process.env.ENABLE_SOCIAL_AUTH || 'false',
  ENABLE_TWO_FACTOR_AUTH: process.env.ENABLE_TWO_FACTOR_AUTH || 'true',
  
  // Резервное копирование
  BACKUP_ENABLED: process.env.BACKUP_ENABLED || 'false',
  BACKUP_SCHEDULE: process.env.BACKUP_SCHEDULE || '0 2 * * *',
  BACKUP_RETENTION: process.env.BACKUP_RETENTION || '30',
  BACKUP_PATH: process.env.BACKUP_PATH || './backups',
  
  // Дополнительные настройки
  API_VERSION: process.env.API_VERSION || 'v1',
  TIMEZONE: process.env.TIMEZONE || 'Europe/Moscow',
  LOCALE: process.env.LOCALE || 'ru-RU'
};

// Функция для валидации конфигурации
module.exports.validateConfig = () => {
  const errors = [];
  
  // Проверяем критически важные переменные
  if (!module.exports.JWT_SECRET) {
    errors.push('JWT_SECRET не установлен');
  }
  
  if (!module.exports.DB_PASSWORD && module.exports.DB_TYPE === 'postgresql') {
    errors.push('DB_PASSWORD не установлен для PostgreSQL');
  }
  
  if (module.exports.OPENAI_API_KEY) {
    console.log('✅ OpenAI API ключ настроен');
  }
  
  if (errors.length > 0) {
    console.error('❌ Ошибки конфигурации:');
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }
  
  console.log('✅ Конфигурация проверена успешно');
};