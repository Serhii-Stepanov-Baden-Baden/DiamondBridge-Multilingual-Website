const winston = require('winston');
const path = require('path');
const config = require('../config');

// Создаем директории для логов если их нет
const fs = require('fs');
const logDir = path.join(__dirname, '..', 'logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Кастомный форматтер для русского языка
const russianFormatter = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Создаем основной logger
const logger = winston.createLogger({
  level: config.logging.level,
  format: russianFormatter,
  defaultMeta: { service: 'diamondbridge-backend' },
  transports: [
    // Файл для всех логов
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Отдельный файл для ошибок
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Файл для логов API запросов
    new winston.transports.File({
      filename: path.join(logDir, 'api.log'),
      level: 'info',
      maxsize: 10485760, // 10MB
      maxFiles: 3,
      tailable: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ],
  
  // Обработка необработанных исключений
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      maxsize: 10485760,
      maxFiles: 3
    })
  ],
  
  // Обработка необработанных отклонений промисов
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      maxsize: 10485760,
      maxFiles: 3
    })
  ]
});

// Добавляем консольный вывод в не production окружении
if (config.env !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ level, message, timestamp }) => {
        return `${timestamp} [${level}]: ${message}`;
      })
    )
  }));
}

// Создаем специализированные logger'ы для разных модулей
const loggers = {
  // Logger для API запросов
  api: winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.File({
        filename: path.join(logDir, 'api-requests.log'),
        maxsize: 10485760,
        maxFiles: 10,
        tailable: true
      })
    ]
  }),
  
  // Logger для базы данных
  database: winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.File({
        filename: path.join(logDir, 'database.log'),
        maxsize: 10485760,
        maxFiles: 5,
        tailable: true
      })
    ]
  }),
  
  // Logger для AI сервисов
  ai: winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.File({
        filename: path.join(logDir, 'ai-services.log'),
        maxsize: 10485760,
        maxFiles: 5,
        tailable: true
      })
    ]
  }),
  
  // Logger для безопасности
  security: winston.createLogger({
    level: 'warn',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.File({
        filename: path.join(logDir, 'security.log'),
        maxsize: 10485760,
        maxFiles: 10,
        tailable: true
      })
    ]
  }),
  
  // Logger для производительности
  performance: winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.File({
        filename: path.join(logDir, 'performance.log'),
        maxsize: 10485760,
        maxFiles: 3,
        tailable: true
      })
    ]
  })
};

// Функция для логирования HTTP запросов
const logHttpRequest = (req, res, responseTime) => {
  const logData = {
    method: req.method,
    url: req.originalUrl || req.url,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    contentLength: res.get('content-length') || 0,
    timestamp: new Date().toISOString()
  };
  
  // Добавляем информацию о пользователе если есть
  if (req.user) {
    logData.userId = req.user.id;
    logData.userEmail = req.user.email;
  }
  
  loggers.api.info('HTTP Request', logData);
  
  // Логируем медленные запросы
  if (responseTime > 5000) {
    logger.warn('Медленный запрос', {
      ...logData,
      slowQuery: true
    });
  }
  
  // Логируем ошибки
  if (res.statusCode >= 400) {
    loggers.api.error('HTTP Error', logData);
  }
};

// Функция для логирования операций с базой данных
const logDatabaseOperation = (operation, table, data = {}) => {
  loggers.database.info(`Database ${operation}`, {
    table,
    timestamp: new Date().toISOString(),
    ...data
  });
};

// Функция для логирования AI операций
const logAIOperation = (operation, provider, model, data = {}) => {
  loggers.ai.info(`AI ${operation}`, {
    provider,
    model,
    timestamp: new Date().toISOString(),
    ...data
  });
};

// Функция для логирования событий безопасности
const logSecurityEvent = (event, severity = 'warn', data = {}) => {
  loggers.security[severity](`Security Event: ${event}`, {
    event,
    timestamp: new Date().toISOString(),
    ...data
  });
};

// Функция для логирования метрик производительности
const logPerformance = (metric, value, unit = 'ms', data = {}) => {
  loggers.performance.info(`Performance Metric: ${metric}`, {
    metric,
    value,
    unit,
    timestamp: new Date().toISOString(),
    ...data
  });
};

// Middleware для логирования HTTP запросов
const httpLogger = (req, res, next) => {
  const start = Date.now();
  
  // Логируем входящий запрос
  logger.info('Входящий HTTP запрос', {
    method: req.method,
    url: req.originalUrl || req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length')
  });
  
  // Перехватываем ответ
  const originalSend = res.send;
  res.send = function(data) {
    const responseTime = Date.now() - start;
    logHttpRequest(req, res, responseTime);
    return originalSend.call(this, data);
  };
  
  next();
};

// Функция для создания child logger с дополнительным контекстом
const createChildLogger = (parentLogger, context) => {
  return parentLogger.child(context);
};

// Очистка старых логов (запускается периодически)
const cleanupOldLogs = () => {
  const fs = require('fs').promises;
  const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 дней
  
  const cleanupFile = async (filePath) => {
    try {
      const stats = await fs.stat(filePath);
      const age = Date.now() - stats.mtime.getTime();
      
      if (age > maxAge) {
        await fs.unlink(filePath);
        logger.info('Удален старый лог файл', { file: filePath });
      }
    } catch (error) {
      logger.error('Ошибка при очистке лог файла', { 
        file: filePath, 
        error: error.message 
      });
    }
  };
  
  return {
    run: async () => {
      try {
        const files = await fs.readdir(logDir);
        const logFiles = files.filter(file => file.endsWith('.log'));
        
        await Promise.all(logFiles.map(file => 
          cleanupFile(path.join(logDir, file))
        ));
      } catch (error) {
        logger.error('Ошибка при очистке логов', { error: error.message });
      }
    }
  };
};

// Запускаем периодическую очистку логов
if (config.env === 'production') {
  setInterval(() => {
    cleanupOldLogs().run();
  }, 24 * 60 * 60 * 1000); // Каждые 24 часа
}

// Экспортируем основной logger и вспомогательные функции
module.exports = {
  logger,
  loggers,
  httpLogger,
  logHttpRequest,
  logDatabaseOperation,
  logAIOperation,
  logSecurityEvent,
  logPerformance,
  createChildLogger,
  cleanupOldLogs
};
