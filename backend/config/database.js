const config = require('./environment');

module.exports = {
  // Database Type (postgresql, mysql, mongodb, sqlite)
  type: config.DB_TYPE || 'postgresql',
  
  // PostgreSQL/MySQL Configuration
  host: config.DB_HOST || 'localhost',
  port: parseInt(config.DB_PORT) || 5432,
  database: config.DB_NAME || 'diamondbridge',
  username: config.DB_USER || 'postgres',
  password: config.DB_PASSWORD,
  
  // Connection Pool Configuration
  pool: {
    min: parseInt(config.DB_POOL_MIN) || 2,
    max: parseInt(config.DB_POOL_MAX) || 10,
    acquire: parseInt(config.DB_POOL_ACQUIRE) || 30000,
    idle: parseInt(config.DB_POOL_IDLE) || 10000
  },
  
  // SSL Configuration (for production)
  ssl: config.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false,
  
  // Sync Configuration (for Sequelize)
  synchronize: config.DB_SYNC === 'true',
  logging: config.DB_LOGGING === 'true',
  
  // MongoDB Configuration (if using MongoDB)
  mongo: {
    url: config.MONGO_URL || 'mongodb://localhost:27017/diamondbridge',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: parseInt(config.MONGO_MAX_POOL_SIZE) || 10,
      serverSelectionTimeoutMS: parseInt(config.MONGO_SERVER_TIMEOUT) || 5000,
      socketTimeoutMS: parseInt(config.MONGO_SOCKET_TIMEOUT) || 45000,
    }
  },
  
  // Redis Configuration (for caching and sessions)
  redis: {
    host: config.REDIS_HOST || 'localhost',
    port: parseInt(config.REDIS_PORT) || 6379,
    password: config.REDIS_PASSWORD,
    db: parseInt(config.REDIS_DB) || 0,
    keyPrefix: config.REDIS_KEY_PREFIX || 'diamondbridge:',
    ttl: parseInt(config.REDIS_TTL) || 3600 // 1 hour
  },
  
  // Migration Configuration
  migrations: {
    tableName: 'migrations',
    extension: '.js',
    path: './migrations'
  },
  
  // Seeders Configuration
  seeders: {
    tableName: 'seeders',
    extension: '.js',
    path: './seeders'
  },
  
  // Backup Configuration
  backup: {
    enabled: config.BACKUP_ENABLED === 'true',
    schedule: config.BACKUP_SCHEDULE || '0 2 * * *', // Daily at 2 AM
    retention: parseInt(config.BACKUP_RETENTION) || 30, // Keep backups for 30 days
    path: config.BACKUP_PATH || './backups'
  }
};
