const config = require('./environment');
const databaseConfig = require('./database');
const aiConfig = require('./ai');

module.exports = {
  // Environment
  env: config.NODE_ENV || 'development',
  port: config.PORT || 3000,
  
  // Database
  database: databaseConfig,
  
  // AI Services
  ai: aiConfig,
  
  // JWT Configuration
  jwt: {
    secret: config.JWT_SECRET,
    expiresIn: config.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: config.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  
  // Server Configuration
  server: {
    cors: {
      origin: config.CORS_ORIGIN ? config.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    },
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", 'wss:', 'https:']
        }
      }
    }
  },
  
  // Redis Configuration (for caching and sessions)
  redis: {
    host: config.REDIS_HOST || 'localhost',
    port: config.REDIS_PORT || 6379,
    password: config.REDIS_PASSWORD,
    db: config.REDIS_DB || 0
  },
  
  // File Upload Configuration
  upload: {
    destination: config.UPLOAD_PATH || './uploads',
    maxFileSize: config.MAX_FILE_SIZE || 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain']
  },
  
  // Logging Configuration
  logging: {
    level: config.LOG_LEVEL || 'info',
    format: config.LOG_FORMAT || 'combined'
  },
  
  // API Rate Limiting
  rateLimit: {
    windowMs: config.RATE_LIMIT_WINDOW || 15 * 60 * 1000, // 15 minutes
    max: config.RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
    message: 'Слишком много запросов, попробуйте позже',
    standardHeaders: true,
    legacyHeaders: false
  },
  
  // Security Configuration
  security: {
    bcryptRounds: parseInt(config.BCRYPT_ROUNDS) || 12,
    sessionSecret: config.SESSION_SECRET,
    encryptionKey: config.ENCRYPTION_KEY
  },
  
  // External Services
  external: {
    email: {
      service: config.EMAIL_SERVICE || 'gmail',
      user: config.EMAIL_USER,
      password: config.EMAIL_PASSWORD,
      from: config.EMAIL_FROM || 'noreply@diamondbridge.com'
    },
    sms: {
      provider: config.SMS_PROVIDER || 'twilio',
      accountSid: config.SMS_ACCOUNT_SID,
      authToken: config.SMS_AUTH_TOKEN,
      from: config.SMS_FROM
    }
  },
  
  // Feature Flags
  features: {
    enableRegistration: config.ENABLE_REGISTRATION !== 'false',
    enableEmailVerification: config.ENABLE_EMAIL_VERIFICATION !== 'false',
    enableSocialAuth: config.ENABLE_SOCIAL_AUTH === 'true',
    enableTwoFactorAuth: config.ENABLE_TWO_FACTOR_AUTH === 'true'
  }
};
