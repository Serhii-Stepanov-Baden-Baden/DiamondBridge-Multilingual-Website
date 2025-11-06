#!/usr/bin/env node

/**
 * DiamondBridge Status Routes
 * Autonomous Semantic Memory Framework AI Agent Backend
 * 
 * API маршруты для получения статуса системы:
 * - overview: общий обзор системы
 * - metrics: метрики производительности
 * - activity: история активности
 * - monitoring: мониторинг в реальном времени
 * 
 * Author: Serhii Stepanov
 * Version: 1.0.0
 * License: MIT
 */

const express = require('express');
const { query, param, validationResult } = require('express-validator');
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
 * Вспомогательная функция для форматирования времени
 */
function formatTimestamp(timestamp) {
  return new Date(timestamp).toISOString();
}

/**
 * Вспомогательная функция для расчета процентов
 */
function calculatePercentage(value, total) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

// ==================== SYSTEM OVERVIEW ====================

/**
 * GET /api/status/overview
 * Общий обзор состояния системы
 */
router.get('/overview',
  async (req, res) => {
    try {
      const overview = {
        timestamp: new Date().toISOString(),
        system: {
          status: 'running',
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          uptime: {
            seconds: process.uptime(),
            formatted: `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`
          }
        },
        modules: {}
      };

      // Получение статуса модулей
      try {
        overview.modules.aiCore = await aiCore.getStatus();
      } catch (error) {
        overview.modules.aiCore = { status: 'error', error: error.message };
      }

      try {
        overview.modules.asmfEngine = await asmfEngine.getStatus();
      } catch (error) {
        overview.modules.asmfEngine = { status: 'error', error: error.message };
      }

      try {
        overview.modules.googleDrive = await googleDrive.getStatus();
      } catch (error) {
        overview.modules.googleDrive = { status: 'error', error: error.message };
      }

      try {
        overview.modules.config = await config.getStatus();
      } catch (error) {
        overview.modules.config = { status: 'error', error: error.message };
      }

      // Подсчет общего количества активных пользователей и сессий
      let totalActiveUsers = 0;
      let totalActiveSessions = 0;

      if (overview.modules.aiCore?.status === 'running') {
        try {
          const aiStats = await aiCore.getStatistics();
          totalActiveUsers = aiStats.activeUsers || 0;
          totalActiveSessions = aiStats.activeSessions || 0;
        } catch (error) {
          logger.warn('Failed to get AI statistics:', error);
        }
      }

      overview.statistics = {
        activeUsers: totalActiveUsers,
        activeSessions: totalActiveSessions,
        totalMemoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
        cpuUsage: process.cpuUsage()
      };

      // Определение общего статуса системы
      const moduleStatuses = Object.values(overview.modules).map(m => m.status);
      const healthyModules = moduleStatuses.filter(status => status === 'running' || status === 'healthy').length;
      const totalModules = moduleStatuses.length;

      overview.system.overallStatus = healthyModules === totalModules ? 'healthy' : 
                                     healthyModules > 0 ? 'degraded' : 'unhealthy';

      res.json({
        success: true,
        data: overview,
        message: 'System overview retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to get system overview:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        code: 'SYSTEM_OVERVIEW_ERROR'
      });
    }
  }
);

// ==================== PERFORMANCE METRICS ====================

/**
 * GET /api/status/metrics
 * Метрики производительности системы
 */
router.get('/metrics',
  [
    query('period')
      .optional()
      .isIn(['1h', '6h', '24h', '7d', '30d'])
      .withMessage('Period must be one of: 1h, 6h, 24h, 7d, 30d'),
    query('metrics')
      .optional()
      .isString()
      .withMessage('Metrics must be a comma-separated string')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { period = '1h', metrics } = req.query;
      
      const metricsData = {
        timestamp: new Date().toISOString(),
        period,
        system: {
          memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024), // MB
            percentage: calculatePercentage(
              process.memoryUsage().heapUsed,
              process.memoryUsage().heapTotal
            )
          },
          cpu: {
            usage: process.cpuUsage(),
            loadAverage: process.platform !== 'win32' ? require('os').loadavg() : null
          },
          uptime: process.uptime()
        },
        modules: {}
      };

      // Получение метрик от модулей
      try {
        metricsData.modules.aiCore = await aiCore.getMetrics({ period, metrics });
      } catch (error) {
        metricsData.modules.aiCore = { error: error.message };
      }

      try {
        metricsData.modules.asmfEngine = await asmfEngine.getMetrics({ period, metrics });
      } catch (error) {
        metricsData.modules.asmfEngine = { error: error.message };
      }

      try {
        metricsData.modules.googleDrive = await googleDrive.getMetrics({ period, metrics });
      } catch (error) {
        metricsData.modules.googleDrive = { error: error.message };
      }

      res.json({
        success: true,
        data: metricsData,
        message: 'Performance metrics retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to get performance metrics:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        code: 'METRICS_ERROR'
      });
    }
  }
);

/**
 * GET /api/status/metrics/realtime
 * Метрики в реальном времени
 */
router.get('/metrics/realtime',
  async (req, res) => {
    try {
      const realtimeMetrics = {
        timestamp: new Date().toISOString(),
        system: {
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          uptime: process.uptime()
        }
      };

      // Получение real-time метрик от модулей
      try {
        realtimeMetrics.aiCore = await aiCore.getRealtimeMetrics();
      } catch (error) {
        realtimeMetrics.aiCore = { error: error.message };
      }

      try {
        realtimeMetrics.asmfEngine = await asmfEngine.getRealtimeMetrics();
      } catch (error) {
        realtimeMetrics.asmfEngine = { error: error.message };
      }

      res.json({
        success: true,
        data: realtimeMetrics,
        message: 'Real-time metrics retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to get real-time metrics:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        code: 'REALTIME_METRICS_ERROR'
      });
    }
  }
);

// ==================== ACTIVITY AND LOGS ====================

/**
 * GET /api/status/activity
 * История активности системы
 */
router.get('/activity',
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Limit must be between 1 and 1000'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be a positive integer'),
    query('level')
      .optional()
      .isIn(['error', 'warn', 'info', 'debug'])
      .withMessage('Log level must be one of: error, warn, info, debug'),
    query('module')
      .optional()
      .isIn(['aiCore', 'asmfEngine', 'googleDrive', 'config', 'system'])
      .withMessage('Module must be one of: aiCore, asmfEngine, googleDrive, config, system')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { limit = 100, offset = 0, level, module } = req.query;

      const activity = {
        timestamp: new Date().toISOString(),
        query: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          level,
          module
        },
        activities: []
      };

      // Получение активности от модулей
      try {
        const [aiCoreActivity, asmfActivity, driveActivity, configActivity] = await Promise.allSettled([
          aiCore.getActivity({ limit: Math.ceil(parseInt(limit) / 4), offset, level, module }),
          asmfEngine.getActivity({ limit: Math.ceil(parseInt(limit) / 4), offset, level, module }),
          googleDrive.getActivity({ limit: Math.ceil(parseInt(limit) / 4), offset, level, module }),
          config.getActivity({ limit: Math.ceil(parseInt(limit) / 4), offset, level, module })
        ]);

        const allActivities = [];
        
        if (aiCoreActivity.status === 'fulfilled') {
          allActivities.push(...aiCoreActivity.value.map(a => ({ ...a, module: 'aiCore' })));
        }
        
        if (asmfActivity.status === 'fulfilled') {
          allActivities.push(...asmfActivity.value.map(a => ({ ...a, module: 'asmfEngine' })));
        }
        
        if (driveActivity.status === 'fulfilled') {
          allActivities.push(...driveActivity.value.map(a => ({ ...a, module: 'googleDrive' })));
        }
        
        if (configActivity.status === 'fulfilled') {
          allActivities.push(...configActivity.value.map(a => ({ ...a, module: 'config' })));
        }

        // Сортировка по времени (новые сначала)
        allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Применение пагинации
        activity.activities = allActivities
          .slice(parseInt(offset), parseInt(offset) + parseInt(limit));
        
        activity.total = allActivities.length;
      } catch (error) {
        logger.warn('Failed to get activity data:', error);
        activity.activities = [];
        activity.total = 0;
      }

      res.json({
        success: true,
        data: activity,
        message: 'Activity data retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to get activity data:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        code: 'ACTIVITY_ERROR'
      });
    }
  }
);

/**
 * GET /api/status/logs
 * Получение логов системы
 */
router.get('/logs',
  [
    query('level')
      .optional()
      .isIn(['error', 'warn', 'info', 'debug'])
      .withMessage('Log level must be one of: error, warn, info, debug'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Limit must be between 1 and 1000'),
    query('since')
      .optional()
      .isISO8601()
      .withMessage('Since must be a valid ISO 8601 date')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { level, limit = 100, since } = req.query;

      const logs = {
        timestamp: new Date().toISOString(),
        filters: { level, limit, since },
        entries: []
      };

      // Получение логов (заглушка - в реальной реализации это будет чтение из файла или БД)
      try {
        logs.entries = await logger.getRecentLogs({
          level,
          limit: parseInt(limit),
          since: since ? new Date(since) : undefined
        });
      } catch (error) {
        logger.warn('Failed to get logs:', error);
        logs.entries = [];
      }

      res.json({
        success: true,
        data: logs,
        message: 'Logs retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to get logs:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        code: 'LOGS_ERROR'
      });
    }
  }
);

// ==================== MONITORING AND ALERTS ====================

/**
 * GET /api/status/monitoring
 * Мониторинг системы и алерты
 */
router.get('/monitoring',
  async (req, res) => {
    try {
      const monitoring = {
        timestamp: new Date().toISOString(),
        alerts: [],
        checks: {}
      };

      // Проверка различных аспектов системы
      const checks = [
        {
          name: 'memory_usage',
          check: () => {
            const memUsage = process.memoryUsage();
            const usagePercentage = (memUsage.heapUsed / memUsage.heapTotal) * 100;
            return {
              status: usagePercentage < 80 ? 'healthy' : usagePercentage < 90 ? 'warning' : 'critical',
              value: Math.round(usagePercentage),
              threshold: 80,
              message: `Memory usage: ${Math.round(usagePercentage)}%`
            };
          }
        },
        {
          name: 'uptime',
          check: () => {
            const uptime = process.uptime();
            return {
              status: uptime > 3600 ? 'healthy' : 'warning',
              value: uptime,
              threshold: 3600,
              message: `Uptime: ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`
            };
          }
        }
      ];

      // Выполнение проверок
      for (const check of checks) {
        try {
          monitoring.checks[check.name] = check.check();
        } catch (error) {
          monitoring.checks[check.name] = {
            status: 'error',
            error: error.message
          };
        }
      }

      // Генерация алертов на основе проверок
      Object.entries(monitoring.checks).forEach(([checkName, result]) => {
        if (result.status === 'critical' || result.status === 'warning') {
          monitoring.alerts.push({
            id: `alert_${checkName}_${Date.now()}`,
            level: result.status,
            check: checkName,
            message: result.message,
            timestamp: new Date().toISOString(),
            acknowledged: false
          });
        }
      });

      // Получение алертов от модулей
      try {
        const moduleAlerts = await Promise.allSettled([
          aiCore.getAlerts(),
          asmfEngine.getAlerts(),
          googleDrive.getAlerts()
        ]);

        moduleAlerts.forEach((result, index) => {
          const moduleNames = ['aiCore', 'asmfEngine', 'googleDrive'];
          if (result.status === 'fulfilled') {
            monitoring.alerts.push(...result.value.map(alert => ({
              ...alert,
              module: moduleNames[index]
            })));
          }
        });
      } catch (error) {
        logger.warn('Failed to get module alerts:', error);
      }

      // Сортировка алертов по времени (новые сначала)
      monitoring.alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      res.json({
        success: true,
        data: monitoring,
        message: 'Monitoring data retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to get monitoring data:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        code: 'MONITORING_ERROR'
      });
    }
  }
);

/**
 * POST /api/status/alerts/:alertId/acknowledge
 * Подтверждение алерта
 */
router.post('/alerts/:alertId/acknowledge',
  [
    param('alertId')
      .notEmpty()
      .isString()
      .withMessage('Alert ID is required'),
    body('acknowledgedBy')
      .optional()
      .isString()
      .withMessage('Acknowledged by must be a string')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { alertId } = req.params;
      const { acknowledgedBy = 'system' } = req.body;

      // В реальной реализации здесь будет логика подтверждения алерта
      // Сейчас это заглушка
      const acknowledged = {
        alertId,
        acknowledgedBy,
        timestamp: new Date().toISOString(),
        acknowledged: true
      };

      logger.info('Alert acknowledged', {
        alertId,
        acknowledgedBy
      });

      res.json({
        success: true,
        data: acknowledged,
        message: 'Alert acknowledged successfully'
      });
    } catch (error) {
      logger.error('Failed to acknowledge alert:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        code: 'ALERT_ACKNOWLEDGE_ERROR'
      });
    }
  }
);

// ==================== DASHBOARD DATA ====================

/**
 * GET /api/status/dashboard
 * Данные для дашборда
 */
router.get('/dashboard',
  async (req, res) => {
    try {
      const dashboard = {
        timestamp: new Date().toISOString(),
        overview: {
          status: 'healthy',
          uptime: process.uptime(),
          activeUsers: 0,
          totalRequests: 0,
          errorRate: 0
        },
        performance: {
          memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
          },
          cpu: process.cpuUsage()
        },
        modules: {},
        recentActivity: [],
        alerts: []
      };

      // Получение данных для дашборда
      try {
        const [aiCoreStatus, asmfStatus, driveStatus, configStatus] = await Promise.allSettled([
          aiCore.getDashboardData(),
          asmfEngine.getDashboardData(),
          googleDrive.getDashboardData(),
          config.getDashboardData()
        ]);

        const moduleNames = ['aiCore', 'asmfEngine', 'googleDrive', 'config'];
        const results = [aiCoreStatus, asmfStatus, driveStatus, configStatus];

        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            dashboard.modules[moduleNames[index]] = result.value;
            
            // Обновление общих метрик
            if (result.value.activeUsers) {
              dashboard.overview.activeUsers += result.value.activeUsers;
            }
            if (result.value.totalRequests) {
              dashboard.overview.totalRequests += result.value.totalRequests;
            }
          }
        });
      } catch (error) {
        logger.warn('Failed to get dashboard data:', error);
      }

      res.json({
        success: true,
        data: dashboard,
        message: 'Dashboard data retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to get dashboard data:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        code: 'DASHBOARD_ERROR'
      });
    }
  }
);

module.exports = router;