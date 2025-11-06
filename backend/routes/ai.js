#!/usr/bin/env node

/**
 * DiamondBridge AI Routes
 * Autonomous Semantic Memory Framework AI Agent Backend
 * 
 * API маршруты для AI операций:
 * - conversation: управление диалогами и сессиями
 * - nlp: обработка естественного языка
 * - training: обучение и анализ документов
 * 
 * Author: Serhii Stepanov
 * Version: 1.0.0
 * License: MIT
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router();

// Import modules
const aiCore = require('../ai-core');
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
    logger.info(`AI Operation: ${operation}`, {
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
    next();
  };
};

// ==================== CONVERSATION ROUTES ====================

/**
 * POST /api/ai/conversation
 * Создание новой диалоговой сессии
 */
router.post('/conversation',
  [
    body('sessionId')
      .optional()
      .isUUID()
      .withMessage('Session ID must be a valid UUID'),
    body('userId')
      .notEmpty()
      .isString()
      .withMessage('User ID is required'),
    body('context')
      .optional()
      .isObject()
      .withMessage('Context must be an object'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object')
  ],
  handleValidationErrors,
  logOperation('CREATE_CONVERSATION'),
  async (req, res) => {
    try {
      const { sessionId, userId, context = {}, metadata = {} } = req.body;
      
      const conversation = await aiCore.conversation.createSession({
        sessionId,
        userId,
        context,
        metadata
      });

      logger.info('Conversation session created', {
        sessionId: conversation.sessionId,
        userId: conversation.userId
      });

      res.status(201).json({
        success: true,
        data: conversation,
        message: 'Conversation session created successfully'
      });
    } catch (error) {
      logger.error('Failed to create conversation session:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

/**
 * POST /api/ai/conversation/:sessionId/message
 * Отправка сообщения в диалог
 */
router.post('/conversation/:sessionId/message',
  [
    param('sessionId')
      .isUUID()
      .withMessage('Valid session ID is required'),
    body('message')
      .notEmpty()
      .isString()
      .isLength({ min: 1, max: 5000 })
      .withMessage('Message is required and must be less than 5000 characters'),
    body('userId')
      .notEmpty()
      .isString()
      .withMessage('User ID is required'),
    body('language')
      .optional()
      .isIn(['en', 'ru', 'ua'])
      .withMessage('Language must be one of: en, ru, ua'),
    body('messageType')
      .optional()
      .isIn(['text', 'voice', 'image'])
      .withMessage('Message type must be one of: text, voice, image')
  ],
  handleValidationErrors,
  logOperation('SEND_MESSAGE'),
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { message, userId, language = 'en', messageType = 'text' } = req.body;

      const response = await aiCore.conversation.processMessage({
        sessionId,
        message,
        userId,
        language,
        messageType
      });

      logger.info('Message processed', {
        sessionId,
        messageId: response.messageId,
        userId
      });

      res.json({
        success: true,
        data: response,
        message: 'Message processed successfully'
      });
    } catch (error) {
      logger.error('Failed to process message:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

/**
 * GET /api/ai/conversation/:sessionId
 * Получение истории диалога
 */
router.get('/conversation/:sessionId',
  [
    param('sessionId')
      .isUUID()
      .withMessage('Valid session ID is required'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be a positive integer')
  ],
  handleValidationErrors,
  logOperation('GET_CONVERSATION_HISTORY'),
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const history = await aiCore.conversation.getHistory(sessionId, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: history,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: history.total || history.messages?.length || 0
        }
      });
    } catch (error) {
      logger.error('Failed to get conversation history:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

/**
 * DELETE /api/ai/conversation/:sessionId
 * Удаление диалоговой сессии
 */
router.delete('/conversation/:sessionId',
  [
    param('sessionId')
      .isUUID()
      .withMessage('Valid session ID is required')
  ],
  handleValidationErrors,
  logOperation('DELETE_CONVERSATION'),
  async (req, res) => {
    try {
      const { sessionId } = req.params;

      await aiCore.conversation.deleteSession(sessionId);

      logger.info('Conversation session deleted', { sessionId });

      res.json({
        success: true,
        message: 'Conversation session deleted successfully'
      });
    } catch (error) {
      logger.error('Failed to delete conversation session:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

// ==================== NLP ROUTES ====================

/**
 * POST /api/ai/nlp/analyze
 * Анализ текста с помощью NLP
 */
router.post('/nlp/analyze',
  [
    body('text')
      .notEmpty()
      .isString()
      .isLength({ min: 1, max: 10000 })
      .withMessage('Text is required and must be less than 10000 characters'),
    body('language')
      .optional()
      .isIn(['en', 'ru', 'ua'])
      .withMessage('Language must be one of: en, ru, ua'),
    body('analysisType')
      .optional()
      .isIn(['sentiment', 'entities', 'intent', 'semantic', 'full'])
      .withMessage('Analysis type must be one of: sentiment, entities, intent, semantic, full')
  ],
  handleValidationErrors,
  logOperation('NLP_ANALYSIS'),
  async (req, res) => {
    try {
      const { text, language = 'en', analysisType = 'full' } = req.body;

      const analysis = await aiCore.nlpProcessor.analyze(text, {
        language,
        analysisType
      });

      logger.info('NLP analysis completed', {
        textLength: text.length,
        language,
        analysisType
      });

      res.json({
        success: true,
        data: analysis,
        message: 'NLP analysis completed successfully'
      });
    } catch (error) {
      logger.error('Failed to perform NLP analysis:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

/**
 * POST /api/ai/nlp/extract-entities
 * Извлечение именованных сущностей
 */
router.post('/nlp/extract-entities',
  [
    body('text')
      .notEmpty()
      .isString()
      .isLength({ min: 1, max: 10000 })
      .withMessage('Text is required'),
    body('language')
      .optional()
      .isIn(['en', 'ru', 'ua'])
      .withMessage('Language must be one of: en, ru, ua')
  ],
  handleValidationErrors,
  logOperation('EXTRACT_ENTITIES'),
  async (req, res) => {
    try {
      const { text, language = 'en' } = req.body;

      const entities = await aiCore.nlpProcessor.extractEntities(text, { language });

      logger.info('Entities extracted', {
        entityCount: entities.length,
        language
      });

      res.json({
        success: true,
        data: entities,
        message: 'Entities extracted successfully'
      });
    } catch (error) {
      logger.error('Failed to extract entities:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

/**
 * POST /api/ai/nlp/sentiment
 * Анализ настроений
 */
router.post('/nlp/sentiment',
  [
    body('text')
      .notEmpty()
      .isString()
      .isLength({ min: 1, max: 10000 })
      .withMessage('Text is required'),
    body('language')
      .optional()
      .isIn(['en', 'ru', 'ua'])
      .withMessage('Language must be one of: en, ru, ua')
  ],
  handleValidationErrors,
  logOperation('SENTIMENT_ANALYSIS'),
  async (req, res) => {
    try {
      const { text, language = 'en' } = req.body;

      const sentiment = await aiCore.nlpProcessor.analyzeSentiment(text, { language });

      logger.info('Sentiment analysis completed', {
        sentiment: sentiment.label,
        confidence: sentiment.confidence,
        language
      });

      res.json({
        success: true,
        data: sentiment,
        message: 'Sentiment analysis completed successfully'
      });
    } catch (error) {
      logger.error('Failed to analyze sentiment:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

// ==================== TRAINING ROUTES ====================

/**
 * POST /api/ai/training/upload
 * Загрузка документа для обучения
 */
router.post('/training/upload',
  [
    body('fileName')
      .notEmpty()
      .isString()
      .withMessage('File name is required'),
    body('fileContent')
      .notEmpty()
      .isString()
      .withMessage('File content is required'),
    body('fileType')
      .isIn(['pdf', 'docx', 'txt', 'md', 'csv', 'json', 'html'])
      .withMessage('File type must be one of: pdf, docx, txt, md, csv, json, html'),
    body('language')
      .optional()
      .isIn(['en', 'ru', 'ua'])
      .withMessage('Language must be one of: en, ru, ua'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object')
  ],
  handleValidationErrors,
  logOperation('TRAINING_UPLOAD'),
  async (req, res) => {
    try {
      const { fileName, fileContent, fileType, language = 'en', metadata = {} } = req.body;

      const result = await aiCore.trainingProcessor.processDocument({
        fileName,
        fileContent,
        fileType,
        language,
        metadata
      });

      logger.info('Document processed for training', {
        fileName,
        fileType,
        language,
        conceptCount: result.concepts?.length || 0
      });

      res.status(201).json({
        success: true,
        data: result,
        message: 'Document processed successfully'
      });
    } catch (error) {
      logger.error('Failed to process document:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

/**
 * POST /api/ai/training/batch
 * Пакетная обработка документов
 */
router.post('/training/batch',
  [
    body('documents')
      .isArray({ min: 1, max: 10 })
      .withMessage('Documents array must contain 1-10 items'),
    body('documents.*.fileName')
      .notEmpty()
      .isString()
      .withMessage('Each document must have a file name'),
    body('documents.*.fileContent')
      .notEmpty()
      .isString()
      .withMessage('Each document must have content'),
    body('documents.*.fileType')
      .isIn(['pdf', 'docx', 'txt', 'md', 'csv', 'json', 'html'])
      .withMessage('Invalid file type'),
    body('documents.*.language')
      .optional()
      .isIn(['en', 'ru', 'ua'])
      .withMessage('Invalid language')
  ],
  handleValidationErrors,
  logOperation('BATCH_TRAINING'),
  async (req, res) => {
    try {
      const { documents } = req.body;

      const results = await aiCore.trainingProcessor.processBatch(documents);

      logger.info('Batch processing completed', {
        documentCount: documents.length,
        successCount: results.success.length,
        errorCount: results.errors.length
      });

      res.status(201).json({
        success: true,
        data: results,
        message: 'Batch processing completed'
      });
    } catch (error) {
      logger.error('Failed to process batch:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

/**
 * GET /api/ai/training/export
 * Экспорт результатов обучения
 */
router.get('/training/export',
  [
    query('format')
      .optional()
      .isIn(['json', 'csv', 'xml'])
      .withMessage('Format must be one of: json, csv, xml'),
    query('includeConcepts')
      .optional()
      .isBoolean()
      .withMessage('includeConcepts must be a boolean'),
    query('includeEvents')
      .optional()
      .isBoolean()
      .withMessage('includeEvents must be a boolean')
  ],
  handleValidationErrors,
  logOperation('EXPORT_TRAINING_DATA'),
  async (req, res) => {
    try {
      const { format = 'json', includeConcepts = true, includeEvents = true } = req.query;

      const exportData = await aiCore.trainingProcessor.export({
        format,
        includeConcepts: includeConcepts === 'true',
        includeEvents: includeEvents === 'true'
      });

      const fileName = `training_export_${Date.now()}.${format}`;
      
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Type', getContentType(format));

      res.send(exportData);

      logger.info('Training data exported', {
        format,
        includeConcepts: includeConcepts === 'true',
        includeEvents: includeEvents === 'true'
      });
    } catch (error) {
      logger.error('Failed to export training data:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

/**
 * GET /api/ai/training/status
 * Статус обучения и статистика
 */
router.get('/training/status',
  logOperation('GET_TRAINING_STATUS'),
  async (req, res) => {
    try {
      const status = await aiCore.trainingProcessor.getStatus();

      res.json({
        success: true,
        data: status,
        message: 'Training status retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to get training status:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

// ==================== UTILITY FUNCTIONS ====================

/**
 * Helper function to get content type for export formats
 */
function getContentType(format) {
  const types = {
    json: 'application/json',
    csv: 'text/csv',
    xml: 'application/xml'
  };
  return types[format] || 'application/octet-stream';
}

module.exports = router;
