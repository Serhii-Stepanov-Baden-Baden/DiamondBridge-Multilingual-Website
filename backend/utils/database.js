const { Sequelize, DataTypes } = require('sequelize');
const redis = require('redis');
const { logger, logDatabaseOperation } = require('./logger');
const config = require('../config');
const { DatabaseError } = require('./error-handler');

// Подключение к PostgreSQL/MySQL через Sequelize
class DatabaseConnection {
  constructor() {
    this.sequelize = null;
    this.models = {};
    this.isConnected = false;
  }

  async connect() {
    try {
      const dialectOptions = {};
      
      // SSL настройки для production
      if (config.database.ssl) {
        dialectOptions.ssl = config.database.ssl;
      }
      
      // Настройки для PostgreSQL
      if (config.database.type === 'postgresql') {
        dialectOptions.dialectOptions = {
          ...dialectOptions.dialectOptions,
          ssl: config.database.ssl ? {
            rejectUnauthorized: false
          } : false,
          connectTimeout: 60000
        };
      }

      this.sequelize = new Sequelize(
        config.database.database,
        config.database.username,
        config.database.password,
        {
          host: config.database.host,
          port: config.database.port,
          dialect: config.database.type,
          logging: config.database.logging ? logger.debug : false,
          pool: {
            min: config.database.pool.min,
            max: config.database.pool.max,
            acquire: config.database.pool.acquire,
            idle: config.database.pool.idle
          },
          dialectOptions,
          define: {
            timestamps: true,
            underscored: false,
            paranoid: false
          },
          sync: {
            alter: config.database.synchronize
          }
        }
      );

      // Тестируем подключение
      await this.sequelize.authenticate();
      this.isConnected = true;
      
      logger.info(`Подключение к базе данных установлено (${config.database.type})`, {
        host: config.database.host,
        port: config.database.port,
        database: config.database.database
      });

      // Определяем модели
      await this.defineModels();
      
      // Синхронизируем схему БД
      if (config.database.synchronize) {
        await this.syncDatabase();
      }

      return this.sequelize;
    } catch (error) {
      logger.error('Ошибка подключения к базе данных', {
        error: error.message,
        host: config.database.host,
        port: config.database.port,
        database: config.database.database
      });
      throw new DatabaseError('Не удается подключиться к базе данных', error);
    }
  }

  async defineModels() {
    // Модель пользователей
    this.models.User = this.sequelize.define('User', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      avatar: {
        type: DataTypes.STRING,
        allowNull: true
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true
      },
      dateOfBirth: {
        type: DataTypes.DATE,
        allowNull: true
      },
      gender: {
        type: DataTypes.ENUM('male', 'female', 'other'),
        allowNull: true
      },
      role: {
        type: DataTypes.ENUM('user', 'admin', 'moderator'),
        defaultValue: 'user'
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'suspended', 'pending'),
        defaultValue: 'pending'
      },
      isEmailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      emailVerificationToken: {
        type: DataTypes.STRING,
        allowNull: true
      },
      passwordResetToken: {
        type: DataTypes.STRING,
        allowNull: true
      },
      passwordResetExpires: {
        type: DataTypes.DATE,
        allowNull: true
      },
      loginAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      lockUntil: {
        type: DataTypes.DATE,
        allowNull: true
      },
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true
      },
      preferences: {
        type: DataTypes.JSONB,
        defaultValue: {}
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
      }
    }, {
      tableName: 'users',
      indexes: [
        { fields: ['email'] },
        { fields: ['role'] },
        { fields: ['status'] },
        { fields: ['createdAt'] }
      ]
    });

    // Модель AI сервисов
    this.models.AIService = this.sequelize.define('AIService', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      provider: {
        type: DataTypes.STRING,
        allowNull: false
      },
      model: {
        type: DataTypes.STRING,
        allowNull: false
      },
      config: {
        type: DataTypes.JSONB,
        defaultValue: {}
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      rateLimit: {
        type: DataTypes.JSONB,
        defaultValue: {}
      },
      usageStats: {
        type: DataTypes.JSONB,
        defaultValue: {}
      }
    }, {
      tableName: 'ai_services'
    });

    // Модель запросов к AI
    this.models.AIRequest = this.sequelize.define('AIRequest', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false
      },
      serviceId: {
        type: DataTypes.UUID,
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM('chat', 'completion', 'embedding', 'image', 'audio', 'translation'),
        allowNull: false
      },
      prompt: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      response: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      model: {
        type: DataTypes.STRING,
        allowNull: false
      },
      tokensUsed: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      cost: {
        type: DataTypes.DECIMAL(10, 6),
        defaultValue: 0
      },
      duration: {
        type: DataTypes.INTEGER, // в миллисекундах
        defaultValue: 0
      },
      status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
        defaultValue: 'pending'
      },
      error: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
      }
    }, {
      tableName: 'ai_requests',
      indexes: [
        { fields: ['userId'] },
        { fields: ['serviceId'] },
        { fields: ['type'] },
        { fields: ['status'] },
        { fields: ['createdAt'] }
      ]
    });

    // Модель сессий
    this.models.Session = this.sequelize.define('Session', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false
      },
      token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      refreshToken: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      refreshExpiresAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      ipAddress: {
        type: DataTypes.STRING,
        allowNull: true
      },
      userAgent: {
        type: DataTypes.STRING,
        allowNull: true
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    }, {
      tableName: 'sessions',
      indexes: [
        { fields: ['userId'] },
        { fields: ['token'] },
        { fields: ['refreshToken'] },
        { fields: ['expiresAt'] }
      ]
    });

    // Модель логов активности
    this.models.ActivityLog = this.sequelize.define('ActivityLog', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true
      },
      action: {
        type: DataTypes.STRING,
        allowNull: false
      },
      resource: {
        type: DataTypes.STRING,
        allowNull: true
      },
      resourceId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      details: {
        type: DataTypes.JSONB,
        defaultValue: {}
      },
      ipAddress: {
        type: DataTypes.STRING,
        allowNull: true
      },
      userAgent: {
        type: DataTypes.STRING,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM('success', 'failure', 'pending'),
        defaultValue: 'success'
      }
    }, {
      tableName: 'activity_logs',
      indexes: [
        { fields: ['userId'] },
        { fields: ['action'] },
        { fields: ['resource'] },
        { fields: ['createdAt'] }
      ]
    });

    // Определяем связи между моделями
    this.defineAssociations();
  }

  defineAssociations() {
    // Пользователь имеет много AI запросов
    this.models.User.hasMany(this.models.AIRequest, {
      foreignKey: 'userId',
      as: 'aiRequests'
    });

    // AI сервис имеет много запросов
    this.models.AIService.hasMany(this.models.AIRequest, {
      foreignKey: 'serviceId',
      as: 'requests'
    });

    // Пользователь имеет много сессий
    this.models.User.hasMany(this.models.Session, {
      foreignKey: 'userId',
      as: 'sessions'
    });

    // Пользователь имеет много логов активности
    this.models.User.hasMany(this.models.ActivityLog, {
      foreignKey: 'userId',
      as: 'activityLogs'
    });

    // Обратные связи
    this.models.AIRequest.belongsTo(this.models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    this.models.AIRequest.belongsTo(this.models.AIService, {
      foreignKey: 'serviceId',
      as: 'service'
    });

    this.models.Session.belongsTo(this.models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    this.models.ActivityLog.belongsTo(this.models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  }

  async syncDatabase() {
    try {
      await this.sequelize.sync({ alter: config.database.synchronize });
      logDatabaseOperation('sync', 'all_tables', {
        alter: config.database.synchronize
      });
      logger.info('База данных синхронизирована');
    } catch (error) {
      logger.error('Ошибка синхронизации базы данных', {
        error: error.message
      });
      throw new DatabaseError('Ошибка синхронизации базы данных', error);
    }
  }

  async disconnect() {
    try {
      if (this.sequelize) {
        await this.sequelize.close();
        this.isConnected = false;
        logger.info('Отключение от базы данных выполнено');
      }
    } catch (error) {
      logger.error('Ошибка отключения от базы данных', {
        error: error.message
      });
    }
  }

  getModel(name) {
    return this.models[name];
  }

  getAllModels() {
    return this.models;
  }
}

// Подключение к Redis
class RedisConnection {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.client = redis.createClient({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        db: config.redis.db,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            return new Error('Redis сервер отклоняет соединение');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Время повторных попыток истекло');
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.client.on('error', (err) => {
        logger.error('Redis Error', { error: err.message });
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Подключение к Redis установлено');
        this.isConnected = true;
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      logger.error('Ошибка подключения к Redis', {
        error: error.message,
        host: config.redis.host,
        port: config.redis.port
      });
      throw new DatabaseError('Не удается подключиться к Redis', error);
    }
  }

  async disconnect() {
    try {
      if (this.client) {
        await this.client.quit();
        this.isConnected = false;
        logger.info('Отключение от Redis выполнено');
      }
    } catch (error) {
      logger.error('Ошибка отключения от Redis', {
        error: error.message
      });
    }
  }

  getClient() {
    return this.client;
  }

  // Утилитарные методы для работы с Redis
  async get(key) {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis GET error', { key, error: error.message });
      return null;
    }
  }

  async set(key, value, ttl = null) {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.client.setEx(key, ttl, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
      return true;
    } catch (error) {
      logger.error('Redis SET error', { key, error: error.message });
      return false;
    }
  }

  async del(key) {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Redis DEL error', { key, error: error.message });
      return false;
    }
  }

  async exists(key) {
    try {
      return await this.client.exists(key);
    } catch (error) {
      logger.error('Redis EXISTS error', { key, error: error.message });
      return false;
    }
  }
}

// Создаем экземпляры подключений
const database = new DatabaseConnection();
const redisClient = new RedisConnection();

// Функция для инициализации всех подключений
const initializeDatabase = async () => {
  try {
    await database.connect();
    await redisClient.connect();
    
    logger.info('Все подключения к базам данных инициализированы');
    return { database, redis: redisClient };
  } catch (error) {
    logger.error('Ошибка инициализации баз данных', {
      error: error.message
    });
    throw error;
  }
};

// Функция для закрытия всех подключений
const closeDatabaseConnections = async () => {
  try {
    await Promise.all([
      database.disconnect(),
      redisClient.disconnect()
    ]);
    logger.info('Все подключения к базам данных закрыты');
  } catch (error) {
    logger.error('Ошибка закрытия подключений к базам данных', {
      error: error.message
    });
  }
};

module.exports = {
  database,
  redis: redisClient,
  initializeDatabase,
  closeDatabaseConnections,
  DatabaseConnection,
  RedisConnection
};
