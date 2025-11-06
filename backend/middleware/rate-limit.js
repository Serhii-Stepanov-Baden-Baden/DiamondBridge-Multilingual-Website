const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { redis } = require('../utils/database');
const { logger, logSecurityEvent } = require('../utils/logger');
const { RateLimitError, createError } = require('../utils/error-handler');
const config = require('../config');

// Функция для создания rate limiter с Redis
const createRedisRateLimiter = (options = {}) => {
  const defaultOptions = {
    store: new RedisStore({
      sendCommand: (...args) => redis.getClient().sendCommand(args),
      prefix: config.redis.keyPrefix + 'ratelimit:'
    }),
    standardHeaders: true, // Возвращаем информацию о лимитах в заголовках
    legacyHeaders: false, // Отключаем устаревшие заголовки
    handler: (req, res) => {
      const remaining = res.getHeader('X-RateLimit-Remaining');
      const resetTime = res.getHeader('X-RateLimit-Reset');
      
      logSecurityEvent('Rate Limit Exceeded', 'warn', {
        ip: req.ip,
        url: req.originalUrl,
        method: req.method,
        userAgent: req.get('User-Agent'),
        user: req.user ? req.user.id : null,
        remaining,
        resetTime
      });

      const error = new RateLimitError(
        options.message || 'Превышен лимит запросов, попробуйте позже'
      );
      
      res.status(error.statusCode).json({
        success: false,
        error: {
          message: error.message,
          code: 'RATE_LIMIT_EXCEEDED',
          resetTime: new Date(resetTime * 1000).toISOString()
        }
      });
    }
  };

  return rateLimit({
    ...defaultOptions,
    ...options
  });
};

// Общий rate limiter для всех API endpoints
const generalLimiter = createRedisRateLimiter({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: config.rateLimit.message,
  keyGenerator: (req) => {
    // Используем IP адрес и ID пользователя если авторизован
    if (req.user) {
      return `user:${req.user.id}`;
    }
    return `ip:${req.ip}`;
  }
});

// Строгий rate limiter для аутентификации
const authLimiter = createRedisRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // 5 попыток
  message: 'Слишком много попыток входа, попробуйте через 15 минут',
  skipSuccessfulRequests: true, // Не считаем успешные запросы
  keyGenerator: (req) => {
    // Используем email и IP для более точного ограничения
    if (req.body?.email) {
      return `auth:${req.body.email}:${req.ip}`;
    }
    return `auth:${req.ip}`;
  }
});

// Rate limiter для регистрации
const registerLimiter = createRedisRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 3, // 3 регистрации
  message: 'Слишком много попыток регистрации, попробуйте через час',
  keyGenerator: (req) => {
    if (req.body?.email) {
      return `register:${req.body.email}:${req.ip}`;
    }
    return `register:${req.ip}`;
  }
});

// Rate limiter для AI сервисов
const aiLimiter = createRedisRateLimiter({
  windowMs: 60 * 1000, // 1 минута
  max: config.ai.rateLimit.requestsPerMinute || 60,
  message: 'Превышен лимит запросов к AI сервисам (60 в минуту)',
  keyGenerator: (req) => {
    if (req.user) {
      return `ai:${req.user.id}`;
    }
    return `ai:${req.ip}`;
  }
});

// Rate limiter для часа (более строгий)
const hourlyAILimiter = createRedisRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 час
  max: config.ai.rateLimit.requestsPerHour || 1000,
  message: 'Превышен лимит запросов к AI сервисам (1000 в час)',
  keyGenerator: (req) => {
    if (req.user) {
      return `ai_hourly:${req.user.id}`;
    }
    return `ai_hourly:${req.ip}`;
  }
});

// Rate limiter для burst запросов
const burstLimiter = createRedisRateLimiter({
  windowMs: 10 * 1000, // 10 секунд
  max: config.ai.rateLimit.burstLimit || 10,
  message: 'Превышен burst лимит запросов',
  keyGenerator: (req) => {
    if (req.user) {
      return `burst:${req.user.id}`;
    }
    return `burst:${req.ip}`;
  }
});

// Rate limiter для API ключей
const apiKeyLimiter = createRedisRateLimiter({
  windowMs: 60 * 1000, // 1 минута
  max: 100, // 100 запросов в минуту для API ключей
  message: 'Превышен лимит для API ключа',
  keyGenerator: (req) => {
    return `api_key:${req.apiKey || 'anonymous'}`;
  }
});

// Rate limiter для файловых загрузок
const uploadLimiter = createRedisRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 20, // 20 загрузок в час
  message: 'Превышен лимит загрузки файлов',
  keyGenerator: (req) => {
    if (req.user) {
      return `upload:${req.user.id}`;
    }
    return `upload:${req.ip}`;
  }
});

// Rate limiter для скачивания файлов
const downloadLimiter = createRedisRateLimiter({
  windowMs: 60 * 1000, // 1 минута
  max: 50, // 50 скачиваний в минуту
  message: 'Превышен лимит скачивания файлов',
  keyGenerator: (req) => {
    if (req.user) {
      return `download:${req.user.id}`;
    }
    return `download:${req.ip}`;
  }
});

// Rate limiter для сброса пароля
const passwordResetLimiter = createRedisRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 3, // 3 попытки сброса в час
  message: 'Слишком много попыток сброса пароля, попробуйте через час',
  keyGenerator: (req) => {
    if (req.body?.email) {
      return `password_reset:${req.body.email}`;
    }
    return `password_reset:${req.ip}`;
  }
});

// Rate limiter для верификации email
const emailVerificationLimiter = createRedisRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 5, // 5 попыток верификации в час
  message: 'Слишком много попыток верификации email, попробуйте через час',
  keyGenerator: (req) => {
    if (req.body?.token) {
      return `email_verify:${req.body.token}`;
    }
    return `email_verify:${req.ip}`;
  }
});

// Rate limiter для админ панели
const adminLimiter = createRedisRateLimiter({
  windowMs: 60 * 1000, // 1 минута
  max: 200, // 200 запросов в минуту для админов
  message: 'Превышен лимит админских запросов',
  keyGenerator: (req) => {
    if (req.user) {
      return `admin:${req.user.id}`;
    }
    return `admin:${req.ip}`;
  }
});

// Dynamic rate limiter на основе пользователя
const dynamicUserLimiter = () => {
  return (req, res, next) => {
    let limiter;
    
    if (req.user) {
      // Премиум пользователи имеют более высокие лимиты
      if (req.user.role === 'premium' || req.user.role === 'admin') {
        limiter = createRedisRateLimiter({
          windowMs: 60 * 1000, // 1 минута
          max: 200, // 200 запросов в минуту
          keyGenerator: () => `user:${req.user.id}`
        });
      } else {
        // Обычные пользователи
        limiter = generalLimiter;
      }
    } else {
      // Неавторизованные пользователи
      limiter = createRedisRateLimiter({
        windowMs: 60 * 1000, // 1 минута
        max: 20, // 20 запросов в минуту
        keyGenerator: () => `anon:${req.ip}`
      });
    }
    
    limiter(req, res, next);
  };
};

// Rate limiter для endpoint-специфичных ограничений
const endpointSpecificLimiter = (endpoint, options = {}) => {
  const defaultOptions = {
    windowMs: 60 * 1000, // 1 минута
    max: 10, // 10 запросов в минуту по умолчанию
    keyGenerator: (req) => {
      return `endpoint:${endpoint}:${req.user ? req.user.id : req.ip}`;
    }
  };

  return createRedisRateLimiter({
    ...defaultOptions,
    ...options
  });
};

// Rate limiter с кастомной логикой для блокировки подозрительной активности
const suspiciousActivityLimiter = createRedisRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 минут
  max: 50, // 50 запросов в 5 минут
  message: 'Обнаружена подозрительная активность, доступ временно ограничен',
  keyGenerator: (req) => {
    // Используем комбинацию IP, User-Agent и других факторов
    const userAgent = req.get('User-Agent') || '';
    const acceptLanguage = req.get('Accept-Language') || '';
    const fingerprint = `${req.ip}:${userAgent.substring(0, 50)}:${acceptLanguage.substring(0, 20)}`;
    return `suspicious:${fingerprint}`;
  },
  handler: (req, res) => {
    logSecurityEvent('Suspicious Activity Detected', 'error', {
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
      userAgent: req.get('User-Agent'),
      user: req.user ? req.user.id : null,
      headers: req.headers
    });
    
    next(createError('RATE_LIMIT', 'Обнаружена подозрительная активность', 429));
  }
});

// Middleware для отслеживания использования AI сервисов
const trackAIUsage = async (req, res, next) => {
  if (!req.user || !req.body?.type?.includes('ai')) {
    return next();
  }

  try {
    const userId = req.user.id;
    const aiType = req.body.type;
    
    // Увеличиваем счетчик использования AI в Redis
    const usageKey = `ai_usage:${userId}:${aiType}`;
    const currentUsage = await redis.get(usageKey) || 0;
    const newUsage = parseInt(currentUsage) + 1;
    
    // Сохраняем сроком на 24 часа
    await redis.set(usageKey, newUsage, 24 * 60 * 60);
    
    // Проверяем лимиты пользователя
    const limits = req.user.limits || {};
    const currentLimits = limits[aiType] || { daily: 100, monthly: 1000 };
    
    if (newUsage > currentLimits.daily) {
      logger.warn('Превышен дневной лимит AI', {
        userId,
        aiType,
        usage: newUsage,
        limit: currentLimits.daily
      });
      
      return next(createError('RATE_LIMIT', `Превышен дневной лимит для ${aiType}`, 429));
    }
    
    next();
  } catch (error) {
    logger.error('Ошибка отслеживания использования AI', {
      error: error.message,
      userId: req.user?.id
    });
    next(); // Продолжаем в случае ошибки
  }
};

// Middleware для проверки лимитов на основе подписки
const subscriptionBasedLimiter = () => {
  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    let maxRequests;
    
    // Определяем лимиты на основе роли/подписки
    switch (req.user.role) {
      case 'admin':
        maxRequests = 1000; // Безлимитно
        break;
      case 'premium':
        maxRequests = 500; // 500 запросов в минуту
        break;
      case 'pro':
        maxRequests = 200; // 200 запросов в минуту
        break;
      default:
        maxRequests = 50; // 50 запросов в минуту для бесплатных
    }

    const limiter = createRedisRateLimiter({
      windowMs: 60 * 1000,
      max: maxRequests,
      keyGenerator: () => `subscription:${req.user.id}`
    });

    limiter(req, res, next);
  };
};

// Middleware для логирования rate limit событий
const logRateLimitEvent = (req, res, next) => {
  res.on('finish', () => {
    const remaining = res.getHeader('X-RateLimit-Remaining');
    
    // Логируем когда остается мало запросов
    if (remaining && parseInt(remaining) < 5) {
      logger.warn('Мало запросов осталось', {
        userId: req.user?.id,
        ip: req.ip,
        url: req.originalUrl,
        method: req.method,
        remaining,
        windowMs: res.getHeader('X-RateLimit-Reset')
      });
    }
  });
  
  next();
};

module.exports = {
  // Основные middleware
  generalLimiter,
  authLimiter,
  registerLimiter,
  aiLimiter,
  hourlyAILimiter,
  burstLimiter,
  apiKeyLimiter,
  uploadLimiter,
  downloadLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
  adminLimiter,
  
  // Специальные middleware
  dynamicUserLimiter,
  endpointSpecificLimiter,
  suspiciousActivityLimiter,
  trackAIUsage,
  subscriptionBasedLimiter,
  logRateLimitEvent,
  
  // Утилиты
  createRedisRateLimiter,
  RateLimitError
};