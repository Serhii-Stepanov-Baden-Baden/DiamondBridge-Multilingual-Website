const Joi = require('joi');
const { logger } = require('../utils/logger');
const { ValidationError, createError } = require('../utils/error-handler');

// Схемы валидации для разных моделей
const schemas = {
  // Регистрация пользователя
  userRegister: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Некорректный формат email',
      'any.required': 'Email обязателен'
    }),
    password: Joi.string().min(8).max(128).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[\\d])(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]')).required().messages({
      'string.min': 'Пароль должен содержать минимум 8 символов',
      'string.max': 'Пароль не может содержать более 128 символов',
      'string.pattern.base': 'Пароль должен содержать заглавные и строчные буквы, цифры и специальные символы',
      'any.required': 'Пароль обязателен'
    }),
    firstName: Joi.string().min(2).max(50).trim().required().messages({
      'string.min': 'Имя должно содержать минимум 2 символа',
      'string.max': 'Имя не может содержать более 50 символов',
      'any.required': 'Имя обязательно'
    }),
    lastName: Joi.string().min(2).max(50).trim().required().messages({
      'string.min': 'Фамилия должна содержать минимум 2 символа',
      'string.max': 'Фамилия не может содержать более 50 символов',
      'any.required': 'Фамилия обязательна'
    }),
    phone: Joi.string().pattern(/^\\+?[1-9]\\d{1,14}$/).optional().messages({
      'string.pattern.base': 'Некорректный формат номера телефона'
    }),
    dateOfBirth: Joi.date().max('now').optional().messages({
      'date.max': 'Дата рождения не может быть в будущем'
    }),
    gender: Joi.string().valid('male', 'female', 'other').optional()
  }),

  // Вход пользователя
  userLogin: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Некорректный формат email',
      'any.required': 'Email обязателен'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Пароль обязателен'
    })
  }),

  // Обновление профиля пользователя
  userUpdate: Joi.object({
    firstName: Joi.string().min(2).max(50).trim().optional(),
    lastName: Joi.string().min(2).max(50).trim().optional(),
    phone: Joi.string().pattern(/^\\+?[1-9]\\d{1,14}$/).optional().messages({
      'string.pattern.base': 'Некорректный формат номера телефона'
    }),
    dateOfBirth: Joi.date().max('now').optional().messages({
      'date.max': 'Дата рождения не может быть в будущем'
    }),
    gender: Joi.string().valid('male', 'female', 'other').optional(),
    preferences: Joi.object().optional()
  }),

  // Изменение пароля
  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      'any.required': 'Текущий пароль обязателен'
    }),
    newPassword: Joi.string().min(8).max(128).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]')).required().messages({
      'string.min': 'Новый пароль должен содержать минимум 8 символов',
      'string.max': 'Новый пароль не может содержать более 128 символов',
      'string.pattern.base': 'Пароль должен содержать заглавные и строчные буквы, цифры и специальные символы',
      'any.required': 'Новый пароль обязателен'
    }),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
      'any.only': 'Подтверждение пароля не совпадает с паролем',
      'any.required': 'Подтверждение пароля обязательно'
    })
  }),

  // Сброс пароля
  forgotPassword: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Некорректный формат email',
      'any.required': 'Email обязателен'
    })
  }),

  resetPassword: Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Токен сброса пароля обязателен'
    }),
    newPassword: Joi.string().min(8).max(128).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]')).required().messages({
      'string.min': 'Пароль должен содержать минимум 8 символов',
      'string.max': 'Пароль не может содержать более 128 символов',
      'string.pattern.base': 'Пароль должен содержать заглавные и строчные буквы, цифры и специальные символы',
      'any.required': 'Пароль обязателен'
    }),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
      'any.only': 'Подтверждение пароля не совпадает с паролем',
      'any.required': 'Подтверждение пароля обязательно'
    })
  }),

  // AI запрос
  aiRequest: Joi.object({
    prompt: Joi.string().min(1).max(4000).required().messages({
      'string.min': 'Промпт не может быть пустым',
      'string.max': 'Промпт не может содержать более 4000 символов',
      'any.required': 'Промпт обязателен'
    }),
    type: Joi.string().valid('chat', 'completion', 'embedding', 'image', 'audio', 'translation').required().messages({
      'any.only': 'Недопустимый тип запроса',
      'any.required': 'Тип запроса обязателен'
    }),
    serviceId: Joi.string().uuid().optional(),
    model: Joi.string().optional(),
    maxTokens: Joi.number().integer().min(1).max(4000).optional(),
    temperature: Joi.number().min(0).max(2).optional(),
    topP: Joi.number().min(0).max(1).optional(),
    frequencyPenalty: Joi.number().min(-2).max(2).optional(),
    presencePenalty: Joi.number().min(-2).max(2).optional(),
    stop: Joi.alternatives().try(
      Joi.string(),
      Joi.array().items(Joi.string())
    ).optional(),
    metadata: Joi.object().optional()
  }),

  // Перевод текста
  translationRequest: Joi.object({
    text: Joi.string().min(1).max(5000).required().messages({
      'string.min': 'Текст не может быть пустым',
      'string.max': 'Текст не может содержать более 5000 символов',
      'any.required': 'Текст обязателен'
    }),
    sourceLang: Joi.string().length(2).optional().messages({
      'string.length': 'Код языка должен содержать 2 символа'
    }),
    targetLang: Joi.string().length(2).required().messages({
      'string.length': 'Код языка должен содержать 2 символа',
      'any.required': 'Целевой язык обязателен'
    }),
    serviceId: Joi.string().uuid().optional()
  }),

  // Генерация изображения
  imageGenerationRequest: Joi.object({
    prompt: Joi.string().min(1).max(1000).required().messages({
      'string.min': 'Описание изображения не может быть пустым',
      'string.max': 'Описание изображения не может содержать более 1000 символов',
      'any.required': 'Описание изображения обязательно'
    }),
    size: Joi.string().valid('256x256', '512x512', '1024x1024', '1024x1792', '1792x1024').optional().default('1024x1024'),
    quality: Joi.string().valid('standard', 'hd').optional().default('standard'),
    style: Joi.string().valid('vivid', 'natural').optional().default('vivid'),
    n: Joi.number().integer().min(1).max(10).optional().default(1),
    serviceId: Joi.string().uuid().optional()
  }),

  // Преобразование текста в речь
  textToSpeechRequest: Joi.object({
    text: Joi.string().min(1).max(4000).required().messages({
      'string.min': 'Текст не может быть пустым',
      'string.max': 'Текст не может содержать более 4000 символов',
      'any.required': 'Текст обязателен'
    }),
    voice: Joi.string().optional(),
    model: Joi.string().valid('tts-1', 'tts-1-hd').optional().default('tts-1'),
    speed: Joi.number().min(0.25).max(4).optional().default(1),
    serviceId: Joi.string().uuid().optional()
  }),

  // Преобразование речи в текст
  speechToTextRequest: Joi.object({
    language: Joi.string().length(2).optional().default('ru'),
    serviceId: Joi.string().uuid().optional(),
    // Файл будет обрабатываться отдельно
  }),

  // Параметры запроса
  pagination: Joi.object({
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(20),
    sort: Joi.string().optional().default('-createdAt'),
    fields: Joi.string().optional()
  }),

  // Параметры поиска
  search: Joi.object({
    q: Joi.string().min(1).max(100).optional(),
    filters: Joi.object().optional(),
    dateFrom: Joi.date().optional(),
    dateTo: Joi.date().optional()
  }),

  // Общие параметры ID
  uuid: Joi.object({
    id: Joi.string().uuid().required().messages({
      'string.guid': 'Некорректный формат ID',
      'any.required': 'ID обязателен'
    })
  }),

  // Загрузка файла
  fileUpload: Joi.object({
    type: Joi.string().valid('image', 'audio', 'document', 'video').required().messages({
      'any.only': 'Недопустимый тип файла',
      'any.required': 'Тип файла обязателен'
    }),
    category: Joi.string().optional()
  })
};

// Middleware для валидации данных запроса
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Показать все ошибки
      allowUnknown: false, // Не разрешать неизвестные поля
      stripUnknown: true // Удалить неизвестные поля
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      logger.warn('Ошибка валидации данных', {
        property,
        errors,
        body: req[property]
      });

      return next(createError('VALIDATION', 'Некорректные данные', 400).toJSON ? 
        createError('VALIDATION', 'Некорректные данные', 400) : 
        new ValidationError(errors.map(e => `${e.field}: ${e.message}`).join(', ')));
    }

    // Заменяем оригинальные данные валидированными
    req[property] = value;
    next();
  };
};

// Middleware для валидации параметров запроса
const validateParams = (schema) => validate(schema, 'params');

// Middleware для валидации query параметров
const validateQuery = (schema) => validate(schema, 'query');

// Middleware для валидации тела запроса
const validateBody = (schema) => validate(schema, 'body');

// Middleware для валидации файлов
const validateFile = (req, res, next) => {
  if (!req.file) {
    return next(createError('VALIDATION', 'Файл не загружен', 400));
  }

  // Проверяем размер файла
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (req.file.size > maxSize) {
    return next(createError('VALIDATION', 'Размер файла превышает максимально допустимый (10MB)', 400));
  }

  // Проверяем тип файла
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'audio/mpeg',
    'audio/wav',
    'audio/mp3',
    'audio/ogg',
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (!allowedTypes.includes(req.file.mimetype)) {
    return next(createError('VALIDATION', 'Недопустимый тип файла', 400));
  }

  next();
};

// Middleware для валидации нескольких файлов
const validateFiles = (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(createError('VALIDATION', 'Файлы не загружены', 400));
  }

  const maxFiles = 10;
  const maxSize = 10 * 1024 * 1024; // 10MB на файл

  if (req.files.length > maxFiles) {
    return next(createError('VALIDATION', `Превышено максимальное количество файлов (${maxFiles})`, 400));
  }

  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'audio/mpeg',
    'audio/wav',
    'audio/mp3',
    'audio/ogg',
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  for (const file of req.files) {
    if (file.size > maxSize) {
      return next(createError('VALIDATION', 'Размер файла превышает максимально допустимый (10MB)', 400));
    }

    if (!allowedTypes.includes(file.mimetype)) {
      return next(createError('VALIDATION', 'Недопустимый тип файла', 400));
    }
  }

  next();
};

// Middleware для валидации JSON структуры
const validateJSON = (req, res, next) => {
  try {
    if (req.is('application/json')) {
      // Если есть тело запроса и оно JSON, пробуем его распарсить
      if (req.body && typeof req.body === 'string') {
        req.body = JSON.parse(req.body);
      }
    }
    next();
  } catch (error) {
    logger.warn('Ошибка парсинга JSON', {
      error: error.message,
      contentType: req.get('Content-Type')
    });
    return next(createError('VALIDATION', 'Некорректный JSON формат', 400));
  }
};

// Middleware для санитизации входных данных
const sanitizeInput = (req, res, next) => {
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    return str
      .trim() // Убираем пробелы в начале и конце
      .replace(/<script[^>]*>.*?<\\/script>/gi, '') // Удаляем скрипты
      .replace(/<[^>]*>/g, '') // Удаляем HTML теги
      .replace(/javascript:/gi, '') // Удаляем javascript: протоколы
      .replace(/on\\w+\\s*=/gi, ''); // Удаляем обработчики событий
  };

  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  };

  // Санитизация body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Санитизация query
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  // Санитизация params
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

// Middleware для проверки Content-Type
const requireContentType = (allowedTypes) => {
  return (req, res, next) => {
    const contentType = req.get('Content-Type');
    
    if (!contentType) {
      return next(createError('VALIDATION', 'Content-Type обязателен', 400));
    }

    const isAllowed = allowedTypes.some(type => 
      contentType.toLowerCase().includes(type.toLowerCase())
    );

    if (!isAllowed) {
      return next(createError('VALIDATION', `Недопустимый Content-Type. Разрешены: ${allowedTypes.join(', ')}`, 400));
    }

    next();
  };
};

// Функция для создания кастомной схемы валидации
const createCustomSchema = (fields) => {
  const schema = {};
  
  Object.entries(fields).forEach(([field, rules]) => {
    let fieldSchema;
    
    switch (rules.type) {
      case 'string':
        fieldSchema = Joi.string();
        if (rules.min !== undefined) fieldSchema = fieldSchema.min(rules.min);
        if (rules.max !== undefined) fieldSchema = fieldSchema.max(rules.max);
        if (rules.pattern) fieldSchema = fieldSchema.pattern(new RegExp(rules.pattern));
        if (rules.required) fieldSchema = fieldSchema.required();
        if (rules.email) fieldSchema = fieldSchema.email();
        break;
      
      case 'number':
        fieldSchema = Joi.number();
        if (rules.min !== undefined) fieldSchema = fieldSchema.min(rules.min);
        if (rules.max !== undefined) fieldSchema = fieldSchema.max(rules.max);
        if (rules.integer) fieldSchema = fieldSchema.integer();
        if (rules.required) fieldSchema = fieldSchema.required();
        break;
      
      case 'array':
        fieldSchema = Joi.array();
        if (rules.items) fieldSchema = fieldSchema.items(rules.items);
        if (rules.min !== undefined) fieldSchema = fieldSchema.min(rules.min);
        if (rules.max !== undefined) fieldSchema = fieldSchema.max(rules.max);
        if (rules.required) fieldSchema = fieldSchema.required();
        break;
      
      case 'object':
        fieldSchema = Joi.object();
        if (rules.required) fieldSchema = fieldSchema.required();
        break;
      
      default:
        fieldSchema = Joi.any();
        if (rules.required) fieldSchema = fieldSchema.required();
    }

    schema[field] = fieldSchema;
  });

  return Joi.object(schema);
};

module.exports = {
  schemas,
  validate,
  validateParams,
  validateQuery,
  validateBody,
  validateFile,
  validateFiles,
  validateJSON,
  sanitizeInput,
  requireContentType,
  createCustomSchema,
  ValidationError
};