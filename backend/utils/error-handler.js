const { logger, logSecurityEvent } = require('./logger');
const config = require('../config');

// Классы ошибок для различных типов ошибок
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400);
    this.name = 'ValidationError';
    this.field = field;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Неавторизованный доступ') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Недостаточно прав доступа') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Ресурс не найден') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message = 'Конфликт данных') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Превышен лимит запросов') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Ошибка базы данных', originalError = null) {
    super(message, 500);
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }
}

class AIError extends AppError {
  constructor(message = 'Ошибка AI сервиса', provider = null, originalError = null) {
    super(message, 502);
    this.name = 'AIError';
    this.provider = provider;
    this.originalError = originalError;
  }
}

class ExternalServiceError extends AppError {
  constructor(message = 'Ошибка внешнего сервиса', service = null, originalError = null) {
    super(message, 502);
    this.name = 'ExternalServiceError';
    this.service = service;
    this.originalError = originalError;
  }
}

// Обработчик ошибок для асинхронных функций
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Отправка ошибки в продакшене/разработке
const sendErrorDev = (err, req, res) => {
  // Логируем ошибку
  logger.error('Ошибка в разработке', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    user: req.user ? req.user.id : null
  });
  
  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      message: err.message,
      status: err.status,
      name: err.name,
      ...(config.env === 'development' && { stack: err.stack })
    }
  });
};

const sendErrorProd = (err, req, res) => {
  // Операционные ошибки - отправляем клиенту
  if (err.isOperational) {
    logSecurityEvent('Operational Error', 'warn', {
      error: err.message,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      user: req.user ? req.user.id : null,
      statusCode: err.statusCode
    });
    
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        status: err.status
      }
    });
  } else {
    // Программные ошибки - не раскрываем детали
    logger.error('Программная ошибка', {
      error: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      user: req.user ? req.user.id : null
    });
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Что-то пошло не так!',
        status: 'error'
      }
    });
  }
};

// Глобальный обработчик ошибок
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  
  if (config.env === 'development') {
    sendErrorDev(err, req, res);
  } else {
    sendErrorProd(err, req, res);
  }
};

// Обработчик необработанных промисов
const handleUnhandledPromiseRejection = () => {
  process.on('unhandledRejection', (err, promise) => {
    logger.error('Необработанное отклонение промиса', {
      error: err.message,
      stack: err.stack,
      promise: promise
    });
    
    // Завершаем процесс
    process.exit(1);
  });
};

// Обработчик необработанных исключений
const handleUncaughtException = () => {
  process.on('uncaughtException', (err) => {
    logger.error('Необработанное исключение', {
      error: err.message,
      stack: err.stack
    });
    
    // Завершаем процесс
    process.exit(1);
  });
};

// Обработчик сигналов завершения
const handleGracefulShutdown = () => {
  const gracefulShutdown = (signal) => {
    logger.info(`Получен сигнал ${signal}. Начинаем корректное завершение...`);
    
    server.close(() => {
      logger.info('HTTP сервер закрыт');
      
      // Закрываем соединения с базой данных
      if (req.app.locals.db) {
        req.app.locals.db.close();
        logger.info('Соединение с БД закрыто');
      }
      
      // Закрываем соединения с Redis
      if (req.app.locals.redis) {
        req.app.locals.redis.quit();
        logger.info('Соединение с Redis закрыто');
      }
      
      logger.info('Приложение корректно завершено');
      process.exit(0);
    });
  };
  
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

// Валидация ошибок базы данных
const handleCastErrorDB = (err) => {
  const message = `Неверный формат данных: ${err.path}: ${err.value}`;
  return new ValidationError(message);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Дублирующееся значение поля: ${value}. Пожалуйста, используйте другое значение!`;
  return new ConflictError(message);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Неверные входные данные: ${errors.join('. ')}`;
  return new ValidationError(message);
};

const handleJWTError = () => {
  return new AuthenticationError('Неверный токен. Пожалуйста, войдите заново!');
};

const handleJWTExpiredError = () => {
  return new AuthenticationError('Ваш токен истек! Пожалуйста, войдите заново.');
};

// Обработчик ошибок AI сервисов
const handleAIError = (error, provider) => {
  logger.error(`Ошибка AI сервиса (${provider})`, {
    error: error.message,
    provider,
    stack: error.stack
  });
  
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return new ExternalServiceError(`Сервис ${provider} недоступен`, provider, error);
  }
  
  if (error.response?.status === 429) {
    return new RateLimitError(`Превышен лимит запросов к ${provider}`);
  }
  
  if (error.response?.status === 401) {
    return new AuthenticationError(`Неверные учетные данные для ${provider}`);
  }
  
  return new AIError(`Ошибка AI сервиса ${provider}: ${error.message}`, provider, error);
};

// Обработчик ошибок базы данных
const handleDatabaseError = (error) => {
  logger.error('Ошибка базы данных', {
    error: error.message,
    code: error.code,
    stack: error.stack
  });
  
  if (error.code === 'ECONNREFUSED') {
    return new DatabaseError('Не удается подключиться к базе данных', error);
  }
  
  if (error.name === 'ValidationError') {
    return handleValidationErrorDB(error);
  }
  
  if (error.code === 11000) {
    return handleDuplicateFieldsDB(error);
  }
  
  if (error.name === 'CastError') {
    return handleCastErrorDB(error);
  }
  
  return new DatabaseError('Ошибка при работе с базой данных', error);
};

// Middleware для обработки 404 ошибок
const notFound = (req, res, next) => {
  const err = new NotFoundError(`Не найден маршрут ${req.originalUrl}`);
  next(err);
};

// Middleware для логирования ошибок
const logError = (err, req, res, next) => {
  logger.error('Error Middleware', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: req.user ? req.user.id : null,
    body: req.body,
    query: req.query,
    params: req.params
  });
  
  next(err);
};

// Функция для создания кастомных ошибок
const createError = (type, message, statusCode = 500) => {
  switch (type) {
    case 'VALIDATION':
      return new ValidationError(message);
    case 'AUTH':
      return new AuthenticationError(message);
    case 'AUTHORIZATION':
      return new AuthorizationError(message);
    case 'NOT_FOUND':
      return new NotFoundError(message);
    case 'CONFLICT':
      return new ConflictError(message);
    case 'RATE_LIMIT':
      return new RateLimitError(message);
    case 'DATABASE':
      return new DatabaseError(message);
    case 'AI':
      return new AIError(message);
    case 'EXTERNAL_SERVICE':
      return new ExternalServiceError(message);
    default:
      return new AppError(message, statusCode);
  }
};

// Инициализация обработчиков ошибок
const initializeErrorHandlers = () => {
  handleUnhandledPromiseRejection();
  handleUncaughtException();
  handleGracefulShutdown();
};

// Экспорт всех функций и классов
module.exports = {
  // Классы ошибок
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  AIError,
  ExternalServiceError,
  
  // Middleware
  globalErrorHandler,
  notFound,
  logError,
  
  // Функции обработки
  catchAsync,
  handleAIError,
  handleDatabaseError,
  handleJWTError,
  handleJWTExpiredError,
  handleCastErrorDB,
  handleDuplicateFieldsDB,
  handleValidationErrorDB,
  
  // Утилиты
  createError,
  initializeErrorHandlers
};