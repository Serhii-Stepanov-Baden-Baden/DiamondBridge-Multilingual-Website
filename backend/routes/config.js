#!/usr/bin/env node

/**
 * DiamondBridge Config Routes
 * Autonomous Semantic Memory Framework AI Agent Backend
 * 
 * API маршруты для конфигурации системы:
 * - system: настройки системы
 * - ai: AI конфигурация
 * - modules: управление модулями
 * - credentials: управление учетными данными
 * - features: управление функциями
 * 
 * Author: Serhii Stepanov
 * Version: 1.0.0
 * License: MIT
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router();

// Import modules
const config = require('../config');
const aiCore = require('../ai-core');
const asmfEngine = require('../asmf-engine');
const googleDrive = require('../google-drive');
const logger = require('../utils/logger');
const { ApiError } = require('../utils/error-handler');

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
 * Middleware для логирования операций
 */
const logOperation = (operation) => {
  return (req, res, next) => {
    logger.info(`Config Operation: ${operation}`, {
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
    next();
  };
};

/**
 * Middleware для проверки прав администратора
 */
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      error: 'Insufficient permissions',
      message: 'Admin access required'
    });
  }
  next();
};

// ==================== SYSTEM CONFIGURATION ROUTES ====================

/**
 * GET /api/config/system
 * Получение общих настроек системы
 */
router.get('/system',
  logOperation('GET_SYSTEM_CONFIG'),
  async (req, res) => {
    try {
      const systemConfig = await config.getSystemConfig();

      // Remove sensitive information
      const sanitizedConfig = {
        ...systemConfig,
        credentials: undefined
      };

      res.json({
        success: true,
        data: sanitizedConfig,
        message: 'System configuration retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to get system configuration:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

/**
 * PUT /api/config/system
 * Обновление настроек системы (только для админов)
 */
router.put('/system',
  requireAdmin,
  [
    body('appName')
      .optional()
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('App name must be a string with 1-100 characters'),
    body('port')
      .optional()
      .isInt({ min: 1024, max: 65535 })
      .withMessage('Port must be between 1024 and 65535'),
    body('maxFileSize')
      .optional()
      .isInt({ min: 1024 })
      .withMessage('Max file size must be at least 1024 bytes'),
    body('maxConcurrentUploads')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Max concurrent uploads must be between 1 and 100'),
    body('logLevel')
      .optional()
      .isIn(['error', 'warn', 'info', 'debug'])
      .withMessage('Log level must be one of: error, warn, info, debug'),
    body('enableCors')
      .optional()
      .isBoolean()
      .withMessage('Enable CORS must be a boolean'),
    body('enableRateLimit')
      .optional()
      .isBoolean()
      .withMessage('Enable rate limit must be a boolean')
  ],
  handleValidationErrors,
  logOperation('UPDATE_SYSTEM_CONFIG'),
  async (req, res) => {
    try {
      const updates = req.body;

      const updatedConfig = await config.updateSystemConfig(updates);

      logger.info('System configuration updated', {
        updates: Object.keys(updates),
        userId: req.user.id
      });

      res.json({
        success: true,
        data: updatedConfig,
        message: 'System configuration updated successfully'
      });
    } catch (error) {
      logger.error('Failed to update system configuration:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

/**
 * GET /api/config/system/health
 * Детальная информация о здоровье системы
 */
router.get('/system/health',
  logOperation('GET_SYSTEM_HEALTH'),
  async (req, res) => {
    try {
      const healthStatus = {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        version: process.version,
        platform: process.platform,
        modules: {}
      };

      // Check module health
      try {
        healthStatus.modules.aiCore = await aiCore.healthCheck();
      } catch (error) {
        healthStatus.modules.aiCore = { status: 'error', error: error.message };
      }

      try {
        healthStatus.modules.asmfEngine = await asmfEngine.healthCheck();
      } catch (error) {
        healthStatus.modules.asmfEngine = { status: 'error', error: error.message };
      }

      try {
        healthStatus.modules.googleDrive = await googleDrive.healthCheck();
      } catch (error) {
        healthStatus.modules.googleDrive = { status: 'error', error: error.message };
      }

      try {
        healthStatus.modules.config = await config.healthCheck();
      } catch (error) {
        healthStatus.modules.config = { status: 'error', error: error.message };
      }

      // Calculate overall status
      const moduleStatuses = Object.values(healthStatus.modules);
      const healthyModules = moduleStatuses.filter(m => m.status === 'healthy').length;
      const totalModules = moduleStatuses.length;
      
      healthStatus.overall = healthyModules === totalModules ? 'healthy' : 
                            healthyModules > 0 ? 'degraded' : 'unhealthy';

      res.json({
        success: true,
        data: healthStatus,
        message: 'System health status retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to get system health:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

// ==================== AI CONFIGURATION ROUTES ====================

/**
 * GET /api/config/ai
 * Получение AI конфигурации
 */
router.get('/ai',
  logOperation('GET_AI_CONFIG'),
  async (req, res) => {
    try {
      const aiConfig = await config.getAIConfig();

      res.json({
        success: true,
        data: aiConfig,
        message: 'AI configuration retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to get AI configuration:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

/**
 * PUT /api/config/ai
 * Обновление AI конфигурации
 */
router.put('/ai',
  requireAdmin,
  [
    body('conversation.maxSessions')
      .optional()
      .isInt({ min: 1, max: 10000 })
      .withMessage('Max sessions must be between 1 and 10000'),
    body('conversation.sessionTimeout')
      .optional()
      .isInt({ min: 60 })
      .withMessage('Session timeout must be at least 60 seconds'),
    body('conversation.maxContextLength')
      .optional()
      .isInt({ min: 10, max: 1000 })
      .withMessage('Max context length must be between 10 and 1000'),
    body('nlp.supportedLanguages')
      .optional()
      .isArray()
      .withMessage('Supported languages must be an array'),
    body('nlp.defaultLanguage')
      .optional()
      .isIn(['en', 'ru', 'ua'])
      .withMessage('Default language must be one of: en, ru, ua'),
    body('training.maxFileSize')
      .optional()
      .isInt({ min: 1024 })
      .withMessage('Max file size must be at least 1024 bytes'),
    body('training.supportedFormats')
      .optional()
      .isArray()
      .withMessage('Supported formats must be an array'),
    body('training.batchSize')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Batch size must be between 1 and 100')
  ],
  handleValidationErrors,
  logOperation('UPDATE_AI_CONFIG'),
  async (req, res) => {
    try {
      const updates = req.body;

      const updatedConfig = await config.updateAIConfig(updates);

      logger.info('AI configuration updated', {
        updates: Object.keys(updates),
        userId: req.user.id
      });

      res.json({
        success: true,
        data: updatedConfig,
        message: 'AI configuration updated successfully'
      });
    } catch (error) {
      logger.error('Failed to update AI configuration:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

/**
 * GET /api/config/ai/models
 * Получение информации о доступных AI моделях
 */
router.get('/ai/models',
  logOperation('GET_AI_MODELS'),
  async (req, res) => {
    try {
      const models = await config.getAIModels();

      res.json({
        success: true,
        data: models,
        message: 'AI models information retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to get AI models:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

/**
 * PUT /api/config/ai/models/:modelName
 * Обновление конфигурации конкретной модели
 */
router.put('/ai/models/:modelName',
  requireAdmin,
  [
    param('modelName')
      .notEmpty()
      .isString()
      .withMessage('Model name is required'),
    body('enabled')
      .isBoolean()
      .withMessage('Enabled must be a boolean'),
    body('parameters')
      .optional()
      .isObject()
      .withMessage('Parameters must be an object')
  ],
  handleValidationErrors,
  logOperation('UPDATE_AI_MODEL_CONFIG'),
  async (req, res) => {
    try {
      const { modelName } = req.params;
      const { enabled, parameters } = req.body;

      const updatedModel = await config.updateAIModel(modelName, {
        enabled,
        parameters
      });

      logger.info('AI model configuration updated', {
        modelName,
        enabled,
        userId: req.user.id
      });

      res.json({
        success: true,
        data: updatedModel,
        message: 'AI model configuration updated successfully'
      });
    } catch (error) {
      logger.error('Failed to update AI model configuration:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

// ==================== MODULE MANAGEMENT ROUTES ====================

/**
 * GET /api/config/modules
 * Получение статуса всех модулей
 */
router.get('/modules',
  logOperation('GET_MODULES_STATUS'),
  async (req, res) => {
    try {
      const modulesStatus = {
        aiCore: {
          status: 'available',
          version: '1.0.0',
          capabilities: ['conversation', 'nlp', 'training'],
          health: await aiCore.healthCheck()
        },
        asmfEngine: {
          status: 'available',
          version: '1.0.0',
          capabilities: ['memory', 'learning', 'consolidation'],
          health: await asmfEngine.healthCheck()
        },
        googleDrive: {
          status: 'available',
          version: '1.0.0',
          capabilities: ['storage', 'backup', 'sync'],
          health: await googleDrive.healthCheck()
        },
        config: {
          status: 'available',
          version: '1.0.0',
          capabilities: ['configuration', 'validation'],
          health: await config.healthCheck()
        }
      };

      res.json({
        success: true,
        data: modulesStatus,
        message: 'Modules status retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to get modules status:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

/**
 * POST /api/config/modules/:moduleName/restart
 * Перезапуск модуля
 */
router.post('/modules/:moduleName/restart',
  requireAdmin,
  [
    param('moduleName')
      .isIn(['aiCore', 'asmfEngine', 'googleDrive', 'config'])
      .withMessage('Invalid module name')
  ],
  handleValidationErrors,
  logOperation('RESTART_MODULE'),
  async (req, res) => {
    try {
      const { moduleName } = req.params;

      let result;
      switch (moduleName) {
        case 'aiCore':
          await aiCore.restart();
          result = { message: 'AI Core restarted successfully' };
          break;
        case 'asmfEngine':
          await asmfEngine.restart();
          result = { message: 'ASMF Engine restarted successfully' };
          break;
        case 'googleDrive':
          await googleDrive.restart();
          result = { message: 'Google Drive integration restarted successfully' };
          break;
        case 'config':
          await config.restart();
          result = { message: 'Config module restarted successfully' };
          break;
      }

      logger.info('Module restarted', {
        moduleName,
        userId: req.user.id
      });

      res.json({
        success: true,
        data: result,
        message: `${moduleName} restarted successfully`
      });
    } catch (error) {
      logger.error('Failed to restart module:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

// ==================== CREDENTIALS MANAGEMENT ROUTES ====================

/**
 * GET /api/config/credentials/status
 * Проверка статуса учетных данных (без раскрытия самих данных)
 */
router.get('/credentials/status',
  logOperation('GET_CREDENTIALS_STATUS'),
  async (req, res) => {
    try {
      const credentialsStatus = await config.getCredentialsStatus();

      res.json({
        success: true,
        data: credentialsStatus,
        message: 'Credentials status retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to get credentials status:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

/**
 * POST /api/config/credentials/validate
 * Проверка валидности учетных данных
 */
router.post('/credentials/validate',
  requireAdmin,
  [
    body('service')
      .isIn(['googleDrive', 'openai', 'anthropic'])
      .withMessage('Service must be one of: googleDrive, openai, anthropic'),
    body('credentials')
      .notEmpty()
      .withMessage('Credentials are required')
  ],
  handleValidationErrors,
  logOperation('VALIDATE_CREDENTIALS'),
  async (req, res) => {
    try {
      const { service, credentials } = req.body;

      const validation = await config.validateCredentials(service, credentials);

      logger.info('Credentials validation completed', {
        service,
        valid: validation.valid,
        userId: req.user.id
      });

      res.json({
        success: true,
        data: validation,
        message: validation.valid ? 'Credentials are valid' : 'Credentials are invalid'
      });
    } catch (error) {
      logger.error('Failed to validate credentials:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

/**
 * PUT /api/config/credentials/update
 * Обновление учетных данных
 */
router.put('/credentials/update',
  requireAdmin,
  [
    body('service')
      .isIn(['googleDrive', 'openai', 'anthropic'])
      .withMessage('Service must be one of: googleDrive, openai, anthropic'),
    body('credentials')
      .notEmpty()
      .withMessage('Credentials are required')
  ],
  handleValidationErrors,
  logOperation('UPDATE_CREDENTIALS'),
  async (req, res) => {
    try {
      const { service, credentials } = req.body;

      await config.updateCredentials(service, credentials);

      logger.info('Credentials updated', {
        service,
        userId: req.user.id
      });

      res.json({
        success: true,
        message: 'Credentials updated successfully'
      });
    } catch (error) {
      logger.error('Failed to update credentials:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

// ==================== FEATURES MANAGEMENT ROUTES ====================

/**
 * GET /api/config/features
 * Получение списка доступных функций
 */
router.get('/features',
  logOperation('GET_FEATURES'),
  async (req, res) => {
    try {
      const features = await config.getFeatures();

      res.json({
        success: true,
        data: features,
        message: 'Features configuration retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to get features:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

/**
 * PUT /api/config/features/:featureName
 * Включение/отключение функции
 */
router.put('/features/:featureName',
  requireAdmin,
  [
    param('featureName')
      .notEmpty()
      .isString()
      .withMessage('Feature name is required'),
    body('enabled')
      .isBoolean()
      .withMessage('Enabled must be a boolean'),
    body('configuration')
      .optional()
      .isObject()
      .withMessage('Configuration must be an object')
  ],
  handleValidationErrors,
  logOperation('UPDATE_FEATURE'),
  async (req, res) => {
    try {
      const { featureName } = req.params;
      const { enabled, configuration } = req.body;

      const updatedFeature = await config.updateFeature(featureName, {
        enabled,
        configuration
      });

      logger.info('Feature updated', {
        featureName,
        enabled,
        userId: req.user.id
      });

      res.json({
        success: true,
        data: updatedFeature,
        message: 'Feature updated successfully'
      });
    } catch (error) {
      logger.error('Failed to update feature:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

// ==================== ENVIRONMENT ROUTES ====================

/**
 * GET /api/config/environment
 * Получение переменных окружения (только публичных)
 */
router.get('/environment',
  logOperation('GET_ENVIRONMENT'),
  async (req, res) => {
    try {
      const envVars = await config.getEnvironmentVariables();

      res.json({
        success: true,
        data: envVars,
        message: 'Environment variables retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to get environment variables:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

module.exports = router;