const { logger, loggers, logHttpRequest, createChildLogger } = require('../utils/logger');
const { database } = require('../utils/database');

// Middleware для логирования входящих HTTP запросов
const requestLogger = (req, res, next) => {
  const start = Date.now();
  const requestId = require('crypto').randomBytes(16).toString('hex');
  
  // Создаем child logger с контекстом запроса
  const reqLogger = createChildLogger(logger, {
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Добавляем requestId в заголовки ответа
  res.setHeader('X-Request-ID', requestId);

  // Логируем входящий запрос
  reqLogger.info('Входящий HTTP запрос', {
    headers: sanitizeHeaders(req.headers),
    query: req.query,
    body: req.method !== 'GET' ? sanitizeBody(req.body) : undefined,
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    referer: req.get('Referer'),
    accept: req.get('Accept'),
    authorization: req.get('Authorization') ? 'Bearer ***' : undefined
  });

  // Перехватываем ответ
  const originalSend = res.send;
  const originalJson = res.json;

  const logResponse = (data, isJson = false) => {
    const duration = Date.now() - start;
    
    // Логируем исходящий ответ
    reqLogger.info('Исходящий HTTP ответ', {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length'),
      responseType: isJson ? 'json' : 'text',
      response: res.statusCode < 400 ? 
        (isJson ? sanitizeResponse(data) : 'success') : 
        (isJson ? sanitizeError(data) : 'error'),
      cacheControl: res.get('Cache-Control'),
      contentType: res.get('Content-Type')
    });

    // Логируем медленные запросы отдельно
    if (duration > 5000) {
      logger.warn('Медленный запрос обнаружен', {
        requestId,
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`,
        statusCode: res.statusCode,
        userId: req.user?.id,
        ip: req.ip
      });
    }

    // Логируем ошибки
    if (res.statusCode >= 400) {
      loggers.api.error('HTTP Error Response', {
        requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userId: req.user?.id,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    }

    // Сохраняем лог в базу данных
    logToDatabase(req, res, duration, requestId);
  };

  // Перехватываем методы отправки ответа
  res.send = function(data) {
    logResponse(data, false);
    return originalSend.call(this, data);
  };

  res.json = function(data) {
    logResponse(data, true);
    return originalJson.call(this, data);
  };

  // Перехватываем окончание запроса (на случай если не было вызова send/json)
  res.on('finish', () => {
    if (!res.headersSent) {
      logResponse(null, false);
    }
  });

  next();
};

// Middleware для детального логирования API запросов
const apiLogger = (req, res, next) => {
  const start = Date.now();
  const apiLogger = createChildLogger(loggers.api, {
    endpoint: req.route?.path || req.originalUrl,
    method: req.method,
    userId: req.user?.id,
    userEmail: req.user?.email,
    apiVersion: req.headers['api-version'] || 'v1',
    requestId: res.getHeader('X-Request-ID')
  });

  // Логируем API запросы с детальной информацией
  apiLogger.info('API Request', {
    endpoint: req.originalUrl,
    method: req.method,
    queryParams: req.query,
    requestBody: req.method !== 'GET' ? sanitizeBody(req.body) : undefined,
    headers: {
      contentType: req.get('Content-Type'),
      userAgent: req.get('User-Agent'),
      accept: req.get('Accept'),
      authorization: req.get('Authorization') ? 'Bearer ***' : 'None'
    },
    clientInfo: {
      ip: req.ip,
      forwardedFor: req.get('X-Forwarded-For'),
      realIp: req.get('X-Real-IP')
    }
  });

  // Обработка окончания запроса
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    apiLogger.info('API Response', {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length'),
      success: res.statusCode < 400
    });

    // Логируем ошибки с дополнительной информацией
    if (res.statusCode >= 400) {
      apiLogger.error('API Error', {
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        errorType: getErrorType(res.statusCode),
        userId: req.user?.id
      });
    }

    // Логируем медленные API запросы
    if (duration > 1000) {
      logger.warn('Медленный API запрос', {
        endpoint: req.originalUrl,
        method: req.method,
        duration: `${duration}ms`,
        statusCode: res.statusCode,
        userId: req.user?.id
      });
    }
  });

  next();
};

// Middleware для логирования базы данных
const databaseLogger = (operation) => {
  return async (req, res, next) => {
    const dbLogger = createChildLogger(loggers.database, {
      operation,
      table: req.tableName || 'unknown',
      userId: req.user?.id,
      requestId: res.getHeader('X-Request-ID')
    });

    const start = Date.now();
    
    try {
      // Логируем начало операции
      dbLogger.debug('Database Operation Started', {
        operation,
        query: req.query || req.sql,
        parameters: req.params || req.values,
        where: req.where
      });

      // Выполняем оригинальную операцию
      const result = await next();
      
      const duration = Date.now() - start;
      
      // Логируем успешное выполнение
      dbLogger.info('Database Operation Completed', {
        operation,
        duration: `${duration}ms`,
        rowsAffected: result?.length || result?.rowCount || 1,
        success: true
      });

      return result;
    } catch (error) {
      const duration = Date.now() - start;
      
      // Логируем ошибку
      dbLogger.error('Database Operation Failed', {
        operation,
        duration: `${duration}ms`,
        error: error.message,
        errorCode: error.code,
        errorStack: error.stack,
        query: req.query || req.sql,
        parameters: req.params || req.values
      });

      throw error;
    }
  };
};

// Middleware для логирования AI запросов
const aiLogger = (req, res, next) => {
  const aiLogger = createChildLogger(loggers.ai, {
    provider: req.body?.provider || 'unknown',
    model: req.body?.model || 'unknown',
    type: req.body?.type || 'unknown',
    userId: req.user?.id,
    requestId: res.getHeader('X-Request-ID')
  });

  const start = Date.now();

  // Логируем начало AI запроса
  aiLogger.info('AI Request Started', {
    type: req.body?.type,
    provider: req.body?.provider,
    model: req.body?.model,
    prompt: req.body?.prompt?.substring(0, 100) + '...', // Первые 100 символов
    parameters: {
      temperature: req.body?.temperature,
      maxTokens: req.body?.maxTokens,
      topP: req.body?.topP
    }
  });

  // Перехватываем ответ
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    
    try {
      const responseData = JSON.parse(data);
      
      // Логируем AI ответ
      aiLogger.info('AI Request Completed', {
        type: req.body?.type,
        duration: `${duration}ms`,
        success: !responseData.error,
        tokensUsed: responseData.usage?.total_tokens || 0,
        cost: responseData.cost || 0,
        error: responseData.error
      });
    } catch (parseError) {
      aiLogger.error('AI Response Parse Error', {
        error: parseError.message,
        response: data?.substring(0, 200)
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

// Middleware для логирования событий безопасности
const securityLogger = (event, severity = 'info', data = {}) => {
  return (req, res, next) => {
    const securityData = {
      event,
      severity,
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      method: req.method,
      userId: req.user?.id,
      userEmail: req.user?.email,
      requestId: res.getHeader('X-Request-ID'),
      headers: sanitizeHeaders(req.headers),
      body: req.method !== 'GET' ? sanitizeBody(req.body) : undefined,
      ...data
    };

    loggers.security[severity](`Security Event: ${event}`, securityData);

    next();
  };
};

// Middleware для логирования производительности
const performanceLogger = (threshold = 1000) => {
  return (req, res, next) => {
    const start = process.hrtime.bigint();
    
    res.on('finish', () => {
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1000000; // Конвертируем в миллисекунды
      
      if (duration > threshold) {
        loggers.performance.warn('Performance Threshold Exceeded', {
          endpoint: req.originalUrl,
          method: req.method,
          duration: `${duration.toFixed(2)}ms`,
          threshold: `${threshold}ms`,
          statusCode: res.statusCode,
          userId: req.user?.id,
          requestId: res.getHeader('X-Request-ID')
        });
      }
    });
    
    next();
  };
};

// Middleware для отслеживания активности пользователя
const activityLogger = (action, resource = null) => {
  return async (req, res, next) => {
    if (!req.user) {
      return next();
    }

    try {
      // Создаем запись об активности
      await database.getModel('ActivityLog').create({
        userId: req.user.id,
        action,
        resource,
        resourceId: req.params.id || req.body?.id,
        details: {
          method: req.method,
          url: req.originalUrl,
          query: req.query,
          body: sanitizeBody(req.body),
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          statusCode: res.statusCode
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        status: res.statusCode < 400 ? 'success' : 'failure'
      });
    } catch (error) {
      logger.error('Ошибка логирования активности', {
        error: error.message,
        userId: req.user.id,
        action,
        resource
      });
    }

    next();
  };
};

// Утилитарные функции
function sanitizeHeaders(headers) {
  const sanitized = { ...headers };
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
  
  sensitiveHeaders.forEach(header => {
    if (sanitized[header]) {
      sanitized[header] = '***';
    }
  });
  
  return sanitized;
}

function sanitizeBody(body) {
  if (!body || typeof body !== 'object') {
    return body;
  }
  
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***';
    }
  });
  
  return sanitized;
}

function sanitizeResponse(data) {
  if (!data) return data;
  
  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    if (parsed.token || parsed.accessToken || parsed.refreshToken) {
      parsed.token = '***';
      parsed.accessToken = '***';
      parsed.refreshToken = '***';
    }
    return parsed;
  } catch (error) {
    return typeof data === 'string' && data.length > 100 ? 
      data.substring(0, 100) + '...' : data;
  }
}

function sanitizeError(data) {
  if (!data) return data;
  
  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    if (parsed.message) {
      parsed.message = parsed.message.length > 100 ? 
        parsed.message.substring(0, 100) + '...' : parsed.message;
    }
    return parsed;
  } catch (error) {
    return typeof data === 'string' && data.length > 100 ? 
      data.substring(0, 100) + '...' : data;
  }
}

function getErrorType(statusCode) {
  if (statusCode >= 400 && statusCode < 500) {
    return statusCode === 401 ? 'AUTHENTICATION' :
           statusCode === 403 ? 'AUTHORIZATION' :
           statusCode === 404 ? 'NOT_FOUND' :
           statusCode === 429 ? 'RATE_LIMIT' :
           'CLIENT_ERROR';
  } else if (statusCode >= 500) {
    return 'SERVER_ERROR';
  }
  return 'UNKNOWN';
}

async function logToDatabase(req, res, duration, requestId) {
  try {
    // Сохраняем основную информацию о запросе в таблицу логов
    await database.getModel('ActivityLog').create({
      userId: req.user?.id,
      action: `${req.method}_${req.route?.path || req.originalUrl}`,
      resource: req.route?.path || 'unknown',
      resourceId: req.params.id,
      details: {
        requestId,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        query: req.query,
        body: req.method !== 'GET' ? sanitizeBody(req.body) : undefined
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      status: res.statusCode < 400 ? 'success' : 'failure'
    });
  } catch (error) {
    // Не прерываем выполнение если не удалось сохранить лог
    logger.error('Ошибка сохранения лога в базу данных', {
      error: error.message,
      requestId
    });
  }
}

// Middleware для логирования входящих WebSocket соединений
const websocketLogger = (socket, userId) => {
  const wsLogger = createChildLogger(logger, {
    socketId: socket.id,
    userId,
    timestamp: new Date().toISOString()
  });

  wsLogger.info('WebSocket Connection Established', {
    ip: socket.request.connection.remoteAddress,
    userAgent: socket.request.headers['user-agent'],
    protocol: socket.request.headers['sec-websocket-protocol']
  });

  return wsLogger;
};

module.exports = {
  requestLogger,
  apiLogger,
  databaseLogger,
  aiLogger,
  securityLogger,
  performanceLogger,
  activityLogger,
  websocketLogger
};
