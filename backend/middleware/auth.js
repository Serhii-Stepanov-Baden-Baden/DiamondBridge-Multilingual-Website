const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { logger, logSecurityEvent } = require('../utils/logger');
const config = require('../config');
const { 
  AuthenticationError, 
  AuthorizationError, 
  createError 
} = require('../utils/error-handler');
const { database, redis } = require('../utils/database');

// Middleware для проверки JWT токена
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      logSecurityEvent('Missing Token', 'warn', {
        ip: req.ip,
        url: req.originalUrl,
        method: req.method
      });
      return next(createError('AUTH', 'Токен доступа обязателен'));
    }

    // Проверяем токен в Redis (для отозванных токенов)
    const tokenKey = `blacklisted_tokens:${token}`;
    const isBlacklisted = await redis.exists(tokenKey);
    
    if (isBlacklisted) {
      logSecurityEvent('Blacklisted Token Used', 'warn', {
        ip: req.ip,
        url: req.originalUrl,
        method: req.method
      });
      return next(createError('AUTH', 'Токен был отозван'));
    }

    // Верифицируем JWT токен
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Получаем пользователя из базы данных
    const user = await database.getModel('User').findByPk(decoded.id, {
      include: [
        {
          model: database.getModel('Session'),
          as: 'sessions',
          where: { token, isActive: true },
          required: false
        }
      ]
    });

    if (!user) {
      logSecurityEvent('User Not Found', 'warn', {
        userId: decoded.id,
        token: token.substring(0, 10) + '...',
        ip: req.ip
      });
      return next(createError('AUTH', 'Пользователь не найден'));
    }

    // Проверяем статус пользователя
    if (user.status === 'suspended') {
      logSecurityEvent('Suspended User Access', 'warn', {
        userId: user.id,
        email: user.email,
        ip: req.ip
      });
      return next(createError('AUTH', 'Аккаунт заблокирован'));
    }

    if (user.status === 'inactive') {
      return next(createError('AUTH', 'Аккаунт неактивен'));
    }

    // Проверяем блокировку аккаунта
    if (user.lockUntil && user.lockUntil > new Date()) {
      logSecurityEvent('Locked Account Access', 'warn', {
        userId: user.id,
        email: user.email,
        lockUntil: user.lockUntil,
        ip: req.ip
      });
      return next(createError('AUTH', 'Аккаунт временно заблокирован'));
    }

    // Обновляем информацию о входе
    await user.update({
      lastLogin: new Date(),
      loginAttempts: 0, // Сбрасываем счетчик неудачных попыток
      lockUntil: null
    });

    // Обновляем сессию
    if (user.sessions && user.sessions.length > 0) {
      const session = user.sessions[0];
      await session.update({
        lastAccessed: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }

    // Добавляем пользователя в запрос
    req.user = user;
    req.token = token;
    
    logger.info('Успешная аутентификация', {
      userId: user.id,
      email: user.email,
      role: user.role,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      logSecurityEvent('Invalid Token', 'warn', {
        error: error.message,
        ip: req.ip,
        url: req.originalUrl
      });
      return next(createError('AUTH', 'Неверный токен'));
    }

    if (error.name === 'TokenExpiredError') {
      logSecurityEvent('Expired Token', 'warn', {
        ip: req.ip,
        url: req.originalUrl
      });
      return next(createError('AUTH', 'Токен истек'));
    }

    logger.error('Ошибка аутентификации', {
      error: error.message,
      stack: error.stack,
      ip: req.ip
    });
    next(error);
  }
};

// Middleware для проверки ролей
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(createError('AUTH', 'Требуется аутентификация'));
    }

    if (!roles.includes(req.user.role)) {
      logSecurityEvent('Insufficient Privileges', 'warn', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        url: req.originalUrl,
        ip: req.ip
      });
      return next(createError('AUTHORIZATION', 'Недостаточно прав доступа'));
    }

    next();
  };
};

// Middleware для проверки владельца ресурса или админа
const authorizeOwnerOrAdmin = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return next(createError('AUTH', 'Требуется аутентификация'));
    }

    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField] || req.user.id;
    
    // Админ имеет доступ ко всем ресурсам
    if (req.user.role === 'admin') {
      return next();
    }

    // Пользователь может обращаться только к своим ресурсам
    if (req.user.id !== resourceUserId) {
      logSecurityEvent('Unauthorized Resource Access', 'warn', {
        userId: req.user.id,
        resourceUserId,
        url: req.originalUrl,
        ip: req.ip
      });
      return next(createError('AUTHORIZATION', 'Доступ запрещен к этому ресурсу'));
    }

    next();
  };
};

// Middleware для проверки верификации email
const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return next(createError('AUTH', 'Требуется аутентификация'));
  }

  if (!req.user.isEmailVerified) {
    logSecurityEvent('Email Verification Required', 'warn', {
      userId: req.user.id,
      email: req.user.email,
      ip: req.ip
    });
    return next(createError('AUTH', 'Требуется верификация email адреса'));
  }

  next();
};

// Middleware для проверки активности пользователя
const requireActiveUser = (req, res, next) => {
  if (!req.user) {
    return next(createError('AUTH', 'Требуется аутентификация'));
  }

  if (req.user.status !== 'active') {
    logSecurityEvent('Inactive User Access', 'warn', {
      userId: req.user.id,
      status: req.user.status,
      ip: req.ip
    });
    return next(createError('AUTH', 'Аккаунт неактивен'));
  }

  next();
};

// Middleware для опциональной аутентификации
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await database.getModel('User').findByPk(decoded.id);
    
    if (user && user.status === 'active' && !user.lockUntil) {
      req.user = user;
      req.token = token;
    } else {
      req.user = null;
    }
  } catch (error) {
    req.user = null;
  }

  next();
};

// Функция для генерации JWT токенов
const generateTokens = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });

  const refreshToken = jwt.sign({ id: user.id }, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn
  });

  return { accessToken, refreshToken };
};

// Функция для создания сессии
const createSession = async (user, req, refreshToken) => {
  try {
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
    
    const sessionData = {
      userId: user.id,
      token: accessToken,
      refreshToken: newRefreshToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 часа
      refreshExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 дней
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      isActive: true
    };

    const session = await database.getModel('Session').create(sessionData);
    
    return { session, accessToken, refreshToken: newRefreshToken };
  } catch (error) {
    logger.error('Ошибка создания сессии', {
      error: error.message,
      userId: user.id
    });
    throw error;
  }
};

// Функция для обновления токена
const refreshTokens = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, config.jwt.secret);
    
    const user = await database.getModel('User').findByPk(decoded.id);
    if (!user || user.status !== 'active') {
      throw createError('AUTH', 'Неверный refresh токен');
    }

    const session = await database.getModel('Session').findOne({
      where: {
        refreshToken,
        userId: user.id,
        isActive: true
      }
    });

    if (!session) {
      throw createError('AUTH', 'Сессия не найдена');
    }

    // Создаем новые токены
    const tokens = generateTokens(user);
    
    // Обновляем сессию
    await session.update({
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      refreshExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      lastAccessed: new Date()
    });

    return tokens;
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw createError('AUTH', 'Неверный refresh токен');
    }
    throw error;
  }
};

// Функция для выхода из системы
const logout = async (token, userId = null) => {
  try {
    // Добавляем токен в черный список
    const tokenKey = `blacklisted_tokens:${token}`;
    await redis.set(tokenKey, true, 86400); // 24 часа

    // Деактивируем сессию в базе данных
    const session = await database.getModel('Session').findOne({
      where: {
        token,
        ...(userId && { userId })
      }
    });

    if (session) {
      await session.update({ isActive: false });
    }

    logger.info('Пользователь вышел из системы', {
      userId,
      token: token.substring(0, 10) + '...'
    });

    return true;
  } catch (error) {
    logger.error('Ошибка при выходе из системы', {
      error: error.message,
      userId
    });
    return false;
  }
};

// Функция для выхода из всех сессий
const logoutAll = async (userId) => {
  try {
    // Находим все активные сессии пользователя
    const sessions = await database.getModel('Session').findAll({
      where: {
        userId,
        isActive: true
      }
    });

    // Добавляем все токены в черный список
    const blacklistPromises = sessions.map(session => {
      const tokenKey = `blacklisted_tokens:${session.token}`;
      return redis.set(tokenKey, true, 86400);
    });

    await Promise.all(blacklistPromises);

    // Деактивируем все сессии
    await database.getModel('Session').update(
      { isActive: false },
      { where: { userId, isActive: true } }
    );

    logger.info('Пользователь вышел из всех сессий', { userId });
    return true;
  } catch (error) {
    logger.error('Ошибка при выходе из всех сессий', {
      error: error.message,
      userId
    });
    return false;
  }
};

// Middleware для проверки лимитов пользователя
const checkUserLimits = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(createError('AUTH', 'Требуется аутентификация'));
    }

    // Проверяем активные AI запросы пользователя
    const activeRequests = await database.getModel('AIRequest').count({
      where: {
        userId: req.user.id,
        status: 'pending'
      }
    });

    const maxConcurrentRequests = config.ai.agents.maxConcurrent || 5;
    
    if (activeRequests >= maxConcurrentRequests) {
      return next(createError('RATE_LIMIT', 
        `Превышен лимит одновременных запросов (${maxConcurrentRequests})`));
    }

    next();
  } catch (error) {
    logger.error('Ошибка проверки лимитов пользователя', {
      error: error.message,
      userId: req.user?.id
    });
    next(error);
  }
};

// Middleware для блокировки аккаунта при превышении лимита неудачных попыток
const handleFailedLogin = async (email, ip) => {
  try {
    const user = await database.getModel('User').findOne({ where: { email } });
    if (!user) return;

    const maxAttempts = 5;
    const lockTime = 30 * 60 * 1000; // 30 минут

    // Увеличиваем счетчик неудачных попыток
    const attempts = (user.loginAttempts || 0) + 1;
    
    let lockUntil = null;
    if (attempts >= maxAttempts) {
      lockUntil = new Date(Date.now() + lockTime);
    }

    await user.update({
      loginAttempts: attempts,
      lockUntil
    });

    logSecurityEvent('Failed Login Attempt', 'warn', {
      userId: user.id,
      email: user.email,
      attempts,
      maxAttempts,
      lockUntil,
      ip
    });

    if (lockUntil) {
      logger.warn('Аккаунт заблокирован после превышения лимита неудачных попыток', {
        userId: user.id,
        email: user.email,
        attempts,
        lockUntil
      });
    }
  } catch (error) {
    logger.error('Ошибка обработки неудачной попытки входа', {
      error: error.message,
      email,
      ip
    });
  }
};

module.exports = {
  // Middleware
  authenticateToken,
  authorize,
  authorizeOwnerOrAdmin,
  requireEmailVerification,
  requireActiveUser,
  optionalAuth,
  checkUserLimits,
  
  // Утилиты
  generateTokens,
  createSession,
  refreshTokens,
  logout,
  logoutAll,
  handleFailedLogin,
  
  // Ошибки
  AuthenticationError,
  AuthorizationError
};