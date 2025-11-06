#!/usr/bin/env node

/**
 * DiamondBridge Health Routes
 * Autonomous Semantic Memory Framework AI Agent Backend
 * 
 * API маршруты для проверки здоровья системы:
 * - basic: базовая проверка
 * - detailed: детальная диагностика
 * - modules: проверка модулей
 * - database: проверка базы данных
 * - external: проверка внешних сервисов
 * 
 * Author: Serhii Stepanov
 * Version: 1.0.0
 * License: MIT
 */

const express = require('express');
const { query, validationResult } = require('express-validator');
const router = express.Router();

// Import modules
const aiCore = require('../ai-core');
const asmfEngine = require('../asmf-engine');
const googleDrive = require('../google-drive');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Middleware для проверки результатов валидации
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * Вспомогательная функция для форматирования времени работы
 */
function formatUptime(uptimeSeconds) {
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Вспомогательная функция для получения использования памяти в MB
 */
function getMemoryUsage() {
  const memUsage = process.memoryUsage();
  return {
    rss: Math.round(memUsage.rss / 1024 / 1024), // MB
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
    external: Math.round(memUsage.external / 1024 / 1024), // MB
    arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024) // MB
  };
}

/**
 * Вспомогательная функция для проверки статуса модуля
 */
async function checkModuleHealth(moduleName, moduleInstance) {
  try {
    const health = await moduleInstance.healthCheck();
    return {
      status: 'healthy',
      module: moduleName,
      ...health
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      module: moduleName,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// ==================== BASIC HEALTH CHECK ====================

/**
 * GET /api/health
 * Базовая проверка здоровья системы
 */
router.get('/', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: process.uptime(),
      formatted: formatUptime(process.uptime())
    },
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    nodejs: process.version,
    platform: process.platform,
    memory: getMemoryUsage(),
    cpu: {
      usage: process.cpuUsage(),
      loadAverage: process.platform !== 'win32' ? require('os').loadavg() : null
    }
  };

  const statusCode = health.status === 'healthy' ? 200 : 503;
  
  res.status(statusCode).json(health);
});

// ==================== DETAILED HEALTH CHECK ====================

/**
 * GET /api/health/detailed
 * Детальная проверка здоровья системы
 */
router.get('/detailed',
  handleValidationErrors,
  async (req, res) => {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: {
          seconds: process.uptime(),
          formatted: formatUptime(process.uptime())
        },
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        nodejs: {
          version: process.version,
          platform: process.platform,
          arch: process.arch,
          pid: process.pid
        },
        memory: getMemoryUsage(),
        cpu: {
          usage: process.cpuUsage(),
          loadAverage: process.platform !== 'win32' ? require('os').loadavg() : null,
          count: require('os').cpus().length
        },
        modules: {}
      };

      // Проверка модулей
      const moduleChecks = await Promise.allSettled([
        checkModuleHealth('aiCore', aiCore),
        checkModuleHealth('asmfEngine', asmfEngine),
        checkModuleHealth('googleDrive', googleDrive),
        checkModuleHealth('config', config)
      ]);

      let healthyModules = 0;
      moduleChecks.forEach((result, index) => {
        const moduleNames = ['aiCore', 'asmfEngine', 'googleDrive', 'config'];
        if (result.status === 'fulfilled') {
          health.modules[moduleNames[index]] = result.value;
          if (result.value.status === 'healthy') {
            healthyModules++;
          }
        } else {
          health.modules[moduleNames[index]] = {
            status: 'error',
            module: moduleNames[index],
            error: result.reason.message,
            timestamp: new Date().toISOString()
          };
        }
      });

      // Определение общего статуса
      const totalModules = Object.keys(health.modules).length;
      if (healthyModules === totalModules) {
        health.status = 'healthy';
      } else if (healthyModules > 0) {
        health.status = 'degraded';
      } else {
        health.status = 'unhealthy';
      }

      health.summary = {
        totalModules,
        healthyModules,
        unhealthyModules: totalModules - healthyModules
      };

      const statusCode = health.status === 'healthy' ? 200 : 
                        health.status === 'degraded' ? 200 : 503;
      
      res.status(statusCode).json(health);
    } catch (error) {
      logger.error('Failed to perform detailed health check:', error);
      
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        details: 'Failed to perform health check'
      });
    }
  }
);

// ==================== MODULE-SPECIFIC HEALTH CHECKS ====================

/**
 * GET /api/health/modules
 * Проверка всех модулей отдельно
 */
router.get('/modules',
  async (req, res) => {
    try {
      const moduleHealth = {};

      // AI Core
      try {
        moduleHealth.aiCore = await checkModuleHealth('aiCore', aiCore);
      } catch (error) {
        moduleHealth.aiCore = {
          status: 'error',
          module: 'aiCore',
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }

      // ASMF Engine
      try {
        moduleHealth.asmfEngine = await checkModuleHealth('asmfEngine', asmfEngine);
      } catch (error) {
        moduleHealth.asmfEngine = {
          status: 'error',
          module: 'asmfEngine',
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }

      // Google Drive
      try {
        moduleHealth.googleDrive = await checkModuleHealth('googleDrive', googleDrive);
      } catch (error) {
        moduleHealth.googleDrive = {
          status: 'error',
          module: 'googleDrive',
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }

      // Config
      try {
        moduleHealth.config = await checkModuleHealth('config', config);
      } catch (error) {
        moduleHealth.config = {
          status: 'error',
          module: 'config',
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }

      res.json({
        timestamp: new Date().toISOString(),
        modules: moduleHealth
      });
    } catch (error) {
      logger.error('Failed to check modules health:', error);
      res.status(503).json({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /api/health/modules/:moduleName
 * Проверка конкретного модуля
 */
router.get('/modules/:moduleName',
  [
    query('moduleName')
      .isIn(['aiCore', 'asmfEngine', 'googleDrive', 'config'])
      .withMessage('Invalid module name')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { moduleName } = req.params;
      
      let moduleInstance;
      switch (moduleName) {
        case 'aiCore':
          moduleInstance = aiCore;
          break;
        case 'asmfEngine':
          moduleInstance = asmfEngine;
          break;
        case 'googleDrive':
          moduleInstance = googleDrive;
          break;
        case 'config':
          moduleInstance = config;
          break;
      }

      const moduleHealth = await checkModuleHealth(moduleName, moduleInstance);
      
      const statusCode = moduleHealth.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(moduleHealth);
    } catch (error) {
      logger.error(`Failed to check ${req.params.moduleName} health:`, error);
      res.status(503).json({
        status: 'error',
        module: req.params.moduleName,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

// ==================== EXTERNAL SERVICES HEALTH CHECK ====================

/**
 * GET /api/health/external
 * Проверка внешних сервисов
 */
router.get('/external',
  async (req, res) => {
    try {
      const externalServices = {
        timestamp: new Date().toISOString(),
        services: {}
      };

      // Google Drive API
      try {
        const driveStatus = await googleDrive.healthCheck();
        externalServices.services.googleDrive = {
          status: driveStatus.connected ? 'healthy' : 'unhealthy',
          service: 'Google Drive API',
          ...driveStatus
        };
      } catch (error) {
        externalServices.services.googleDrive = {
          status: 'unhealthy',
          service: 'Google Drive API',
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }

      // Additional external services can be added here
      // e.g., database connections, third-party APIs, etc.

      res.json(externalServices);
    } catch (error) {
      logger.error('Failed to check external services health:', error);
      res.status(503).json({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

// ==================== MEMORY AND PERFORMANCE CHECK ====================

/**
 * GET /api/health/performance
 * Проверка производительности и использования ресурсов
 */
router.get('/performance',
  async (req, res) => {
    try {
      const performance = {
        timestamp: new Date().toISOString(),
        uptime: {
          seconds: process.uptime(),
          formatted: formatUptime(process.uptime())
        },
        memory: getMemoryUsage(),
        cpu: {
          usage: process.cpuUsage(),
          loadAverage: process.platform !== 'win32' ? require('os').loadavg() : null,
          count: require('os').cpus().length
        },
        system: {
          totalMemory: Math.round(require('os').totalmem() / 1024 / 1024 / 1024), // GB
          freeMemory: Math.round(require('os').freemem() / 1024 / 1024 / 1024), // GB
          platform: require('os').platform(),
          arch: require('os').arch(),
          uptime: Math.round(require('os').uptime() / 3600) // hours
        },
        metrics: {}
      };

      // Получение дополнительных метрик от модулей
      try {
        performance.metrics.aiCore = await aiCore.getPerformanceMetrics();
      } catch (error) {
        performance.metrics.aiCore = { error: error.message };
      }

      try {
        performance.metrics.asmfEngine = await asmfEngine.getPerformanceMetrics();
      } catch (error) {
        performance.metrics.asmfEngine = { error: error.message };
      }

      res.json(performance);
    } catch (error) {
      logger.error('Failed to get performance metrics:', error);
      res.status(503).json({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

// ==================== READINESS AND LIVENESS PROBES ====================

/**
 * GET /api/health/ready
 * Readiness probe - готовность системы к приему запросов
 */
router.get('/ready',
  async (req, res) => {
    try {
      const readiness = {
        ready: false,
        timestamp: new Date().toISOString(),
        checks: {}
      };

      // Проверка инициализации модулей
      try {
        const aiCoreHealth = await aiCore.healthCheck();
        readiness.checks.aiCore = aiCoreHealth.status === 'healthy';
      } catch (error) {
        readiness.checks.aiCore = false;
      }

      try {
        const asmfHealth = await asmfEngine.healthCheck();
        readiness.checks.asmfEngine = asmfHealth.status === 'healthy';
      } catch (error) {
        readiness.checks.asmfEngine = false;
      }

      try {
        const configHealth = await config.healthCheck();
        readiness.checks.config = configHealth.status === 'healthy';
      } catch (error) {
        readiness.checks.config = false;
      }

      // Система готова, если все критические модули здоровы
      const criticalChecks = ['aiCore', 'asmfEngine', 'config'];
      readiness.ready = criticalChecks.every(check => readiness.checks[check]);

      const statusCode = readiness.ready ? 200 : 503;
      res.status(statusCode).json(readiness);
    } catch (error) {
      logger.error('Failed to perform readiness check:', error);
      res.status(503).json({
        ready: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /api/health/live
 * Liveness probe - проверка, что система работает
 */
router.get('/live',
  (req, res) => {
    const liveness = {
      alive: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };

    res.status(200).json(liveness);
  }
);

// ==================== HEALTH STATISTICS ====================

/**
 * GET /api/health/stats
 * Статистика использования и производительности
 */
router.get('/stats',
  async (req, res) => {
    try {
      const stats = {
        timestamp: new Date().toISOString(),
        runtime: {
          uptime: {
            seconds: process.uptime(),
            formatted: formatUptime(process.uptime())
          },
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'development'
        },
        resources: {
          memory: getMemoryUsage(),
          cpu: {
            usage: process.cpuUsage(),
            loadAverage: process.platform !== 'win32' ? require('os').loadavg() : null
          }
        }
      };

      // Получение статистики от модулей
      try {
        stats.modules = {};
        
        const [aiCoreStats, asmfStats] = await Promise.allSettled([
          aiCore.getStats(),
          asmfEngine.getStats()
        ]);

        if (aiCoreStats.status === 'fulfilled') {
          stats.modules.aiCore = aiCoreStats.value;
        }

        if (asmfStats.status === 'fulfilled') {
          stats.modules.asmfEngine = asmfStats.value;
        }
      } catch (error) {
        logger.warn('Failed to get module stats:', error);
      }

      res.json(stats);
    } catch (error) {
      logger.error('Failed to get health statistics:', error);
      res.status(503).json({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

module.exports = router;