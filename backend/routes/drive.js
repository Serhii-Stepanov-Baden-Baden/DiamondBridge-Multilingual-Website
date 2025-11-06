#!/usr/bin/env node

/**
 * DiamondBridge Drive Routes
 * Autonomous Semantic Memory Framework AI Agent Backend
 * 
 * API маршруты для Google Drive интеграции:
 * - auth: аутентификация и авторизация
 * - files: управление файлами и папками
 * - upload: загрузка файлов с резюмированием
 * - download: скачивание файлов
 * - backup: резервное копирование данных
 * 
 * Author: Serhii Stepanov
 * Version: 1.0.0
 * License: MIT
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router();

// Import modules
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
    logger.info(`Drive Operation: ${operation}`, {
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
    next();
  };
};

// ==================== AUTHENTICATION ROUTES ====================

/**
 * GET /api/drive/auth/url
 * Получение URL для авторизации в Google Drive
 */
router.get('/auth/url',
  logOperation('GET_AUTH_URL'),
  async (req, res) => {
    try {
      const authUrl = await googleDrive.generateAuthUrl();

      res.json({
        success: true,
        data: {
          authUrl,
          message: 'Visit this URL to authorize the application'
        }
      });
    } catch (error) {
      logger.error('Failed to generate auth URL:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

/**
 * POST /api/drive/auth/callback
 * Обработка callback после авторизации
 */
router.post('/auth/callback',
  [
    body('code')
      .notEmpty()
      .isString()
      .withMessage('Authorization code is required')
  ],
  handleValidationErrors,
  logOperation('AUTH_CALLBACK'),
  async (req, res) => {
    try {
      const { code } = req.body;

      const tokens = await googleDrive.handleAuthCallback(code);

      logger.info('Google Drive authorization successful', {
        userId: req.user?.id
      });

      res.json({
        success: true,
        data: {
          tokens,
          message: 'Authorization successful'
        },
        note: 'Tokens have been securely stored'
      });
    } catch (error) {
      logger.error('Failed to handle auth callback:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

/**
 * GET /api/drive/auth/status
 * Проверка статуса авторизации
 */
router.get('/auth/status',
  logOperation('CHECK_AUTH_STATUS'),
  async (req, res) => {
    try {
      const status = await googleDrive.checkAuthStatus();

      res.json({
        success: true,
        data: status,
        message: status.authorized ? 'Authorized' : 'Not authorized'
      });
    } catch (error) {
      logger.error('Failed to check auth status:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

/**
 * POST /api/drive/auth/refresh
 * Обновление токенов доступа
 */
router.post('/auth/refresh',
  logOperation('REFRESH_TOKENS'),
  async (req, res) => {
    try {
      const tokens = await googleDrive.refreshTokens();

      logger.info('Tokens refreshed successfully');

      res.json({
        success: true,
        data: {
          tokens,
          message: 'Tokens refreshed successfully'
        }
      });
    } catch (error) {
      logger.error('Failed to refresh tokens:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

/**
 * POST /api/drive/auth/revoke
 * Отзыв авторизации
 */
router.post('/auth/revoke',
  logOperation('REVOKE_AUTH'),
  async (req, res) => {
    try {
      await googleDrive.revokeAuth();

      logger.info('Google Drive authorization revoked');

      res.json({
        success: true,
        message: 'Authorization revoked successfully'
      });
    } catch (error) {
      logger.error('Failed to revoke authorization:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

// ==================== FILE MANAGEMENT ROUTES ====================

/**
 * GET /api/drive/files
 * Получение списка файлов
 */
router.get('/files',
  [
    query('folderId')
      .optional()
      .isString()
      .withMessage('Folder ID must be a string'),
    query('pageSize')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Page size must be between 1 and 100'),
    query('pageToken')
      .optional()
      .isString()
      .withMessage('Page token must be a string'),
    query('orderBy')
      .optional()
      .isIn(['name', 'modifiedTime', 'createdTime'])
      .withMessage('Order by must be one of: name, modifiedTime, createdTime'),
    query('search')
      .optional()
      .isString()
      .withMessage('Search must be a string')
  ],
  handleValidationErrors,
  logOperation('LIST_FILES'),
  async (req, res) => {
    try {
      const {
        folderId,
        pageSize = 50,
        pageToken,
        orderBy = 'modifiedTime desc',
        search
      } = req.query;

      const options = {
        folderId,
        pageSize: parseInt(pageSize),
        pageToken,
        orderBy,
        search
      };

      const result = await googleDrive.listFiles(options);

      res.json({
        success: true,
        data: result,
        message: 'Files retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to list files:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

/**
 * GET /api/drive/files/:fileId
 * Получение информации о файле
 */
router.get('/files/:fileId',
  [
    param('fileId')
      .notEmpty()
      .isString()
      .withMessage('File ID is required')
  ],
  handleValidationErrors,
  logOperation('GET_FILE_INFO'),
  async (req, res) => {
    try {
      const { fileId } = req.params;

      const fileInfo = await googleDrive.getFileInfo(fileId);

      res.json({
        success: true,
        data: fileInfo,
        message: 'File information retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to get file info:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

/**
 * POST /api/drive/files/create
 * Создание нового файла
 */
router.post('/files/create',
  [
    body('name')
      .notEmpty()
      .isString()
      .withMessage('File name is required'),
    body('content')
      .optional()
      .isString()
      .withMessage('Content must be a string'),
    body('mimeType')
      .optional()
      .isString()
      .withMessage('MIME type must be a string'),
    body('folderId')
      .optional()
      .isString()
      .withMessage('Folder ID must be a string')
  ],
  handleValidationErrors,
  logOperation('CREATE_FILE'),
  async (req, res) => {
    try {
      const { name, content = '', mimeType = 'text/plain', folderId } = req.body;

      const file = await googleDrive.createFile({
        name,
        content,
        mimeType,
        folderId
      });

      logger.info('File created', {
        fileId: file.id,
        name: file.name
      });

      res.status(201).json({
        success: true,
        data: file,
        message: 'File created successfully'
      });
    } catch (error) {
      logger.error('Failed to create file:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

/**
 * PUT /api/drive/files/:fileId
 * Обновление файла
 */
router.put('/files/:fileId',
  [
    param('fileId')
      .notEmpty()
      .isString()
      .withMessage('File ID is required'),
    body('name')
      .optional()
      .isString()
      .withMessage('Name must be a string'),
    body('content')
      .optional()
      .isString()
      .withMessage('Content must be a string'),
    body('mimeType')
      .optional()
      .isString()
      .withMessage('MIME type must be a string')
  ],
  handleValidationErrors,
  logOperation('UPDATE_FILE'),
  async (req, res) => {
    try {
      const { fileId } = req.params;
      const { name, content, mimeType } = req.body;

      const updates = {};
      if (name !== undefined) updates.name = name;
      if (content !== undefined) updates.content = content;
      if (mimeType !== undefined) updates.mimeType = mimeType;

      const file = await googleDrive.updateFile(fileId, updates);

      logger.info('File updated', {
        fileId: file.id,
        updates: Object.keys(updates)
      });

      res.json({
        success: true,
        data: file,
        message: 'File updated successfully'
      });
    } catch (error) {
      logger.error('Failed to update file:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

/**
 * DELETE /api/drive/files/:fileId
 * Удаление файла
 */
router.delete('/files/:fileId',
  [
    param('fileId')
      .notEmpty()
      .isString()
      .withMessage('File ID is required')
  ],
  handleValidationErrors,
  logOperation('DELETE_FILE'),
  async (req, res) => {
    try {
      const { fileId } = req.params;

      await googleDrive.deleteFile(fileId);

      logger.info('File deleted', { fileId });

      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error) {
      logger.error('Failed to delete file:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

// ==================== FOLDER MANAGEMENT ROUTES ====================

/**
 * POST /api/drive/folders/create
 * Создание новой папки
 */
router.post('/folders/create',
  [
    body('name')
      .notEmpty()
      .isString()
      .withMessage('Folder name is required'),
    body('parentId')
      .optional()
      .isString()
      .withMessage('Parent folder ID must be a string')
  ],
  handleValidationErrors,
  logOperation('CREATE_FOLDER'),
  async (req, res) => {
    try {
      const { name, parentId } = req.body;

      const folder = await googleDrive.createFolder({ name, parentId });

      logger.info('Folder created', {
        folderId: folder.id,
        name: folder.name
      });

      res.status(201).json({
        success: true,
        data: folder,
        message: 'Folder created successfully'
      });
    } catch (error) {
      logger.error('Failed to create folder:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

/**
 * GET /api/drive/folders/:folderId/contents
 * Получение содержимого папки
 */
router.get('/folders/:folderId/contents',
  [
    param('folderId')
      .notEmpty()
      .isString()
      .withMessage('Folder ID is required')
  ],
  handleValidationErrors,
  logOperation('GET_FOLDER_CONTENTS'),
  async (req, res) => {
    try {
      const { folderId } = req.params;

      const contents = await googleDrive.getFolderContents(folderId);

      res.json({
        success: true,
        data: contents,
        message: 'Folder contents retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to get folder contents:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

// ==================== UPLOAD ROUTES ====================

/**
 * POST /api/drive/upload/simple
 * Простая загрузка файла
 */
router.post('/upload/simple',
  [
    body('fileName')
      .notEmpty()
      .isString()
      .withMessage('File name is required'),
    body('fileContent')
      .notEmpty()
      .isString()
      .withMessage('File content is required'),
    body('mimeType')
      .optional()
      .isString()
      .withMessage('MIME type must be a string'),
    body('folderId')
      .optional()
      .isString()
      .withMessage('Folder ID must be a string')
  ],
  handleValidationErrors,
  logOperation('SIMPLE_UPLOAD'),
  async (req, res) => {
    try {
      const { fileName, fileContent, mimeType = 'application/octet-stream', folderId } = req.body;

      const file = await googleDrive.uploadFile({
        fileName,
        fileContent,
        mimeType,
        folderId,
        resumable: false
      });

      logger.info('File uploaded (simple)', {
        fileId: file.id,
        fileName
      });

      res.status(201).json({
        success: true,
        data: file,
        message: 'File uploaded successfully'
      });
    } catch (error) {
      logger.error('Failed to upload file:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

/**
 * POST /api/drive/upload/resumable/init
 * Инициализация резюмируемой загрузки
 */
router.post('/upload/resumable/init',
  [
    body('fileName')
      .notEmpty()
      .isString()
      .withMessage('File name is required'),
    body('fileSize')
      .isInt({ min: 1 })
      .withMessage('File size must be a positive integer'),
    body('mimeType')
      .optional()
      .isString()
      .withMessage('MIME type must be a string'),
    body('folderId')
      .optional()
      .isString()
      .withMessage('Folder ID must be a string')
  ],
  handleValidationErrors,
  logOperation('RESUMABLE_UPLOAD_INIT'),
  async (req, res) => {
    try {
      const { fileName, fileSize, mimeType = 'application/octet-stream', folderId } = req.body;

      const uploadSession = await googleDrive.initResumableUpload({
        fileName,
        fileSize,
        mimeType,
        folderId
      });

      logger.info('Resumable upload initialized', {
        fileName,
        fileSize,
        uploadId: uploadSession.uploadId
      });

      res.json({
        success: true,
        data: uploadSession,
        message: 'Upload session initialized'
      });
    } catch (error) {
      logger.error('Failed to initialize resumable upload:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

/**
 * PUT /api/drive/upload/resumable/:uploadId
 * Загрузка части файла для резюмируемой загрузки
 */
router.put('/upload/resumable/:uploadId',
  [
    param('uploadId')
      .notEmpty()
      .isString()
      .withMessage('Upload ID is required'),
    body('chunk')
      .notEmpty()
      .isString()
      .withMessage('Chunk data is required'),
    body('contentRange')
      .notEmpty()
      .isString()
      .withMessage('Content range header is required')
  ],
  handleValidationErrors,
  logOperation('RESUMABLE_UPLOAD_CHUNK'),
  async (req, res) => {
    try {
      const { uploadId } = req.params;
      const { chunk, contentRange } = req.body;

      const result = await googleDrive.uploadResumableChunk(uploadId, chunk, contentRange);

      logger.info('Chunk uploaded', {
        uploadId,
        contentRange
      });

      res.json({
        success: true,
        data: result,
        message: result.complete ? 'Upload completed' : 'Chunk uploaded successfully'
      });
    } catch (error) {
      logger.error('Failed to upload chunk:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

// ==================== DOWNLOAD ROUTES ====================

/**
 * GET /api/drive/download/:fileId
 * Скачивание файла
 */
router.get('/download/:fileId',
  [
    param('fileId')
      .notEmpty()
      .isString()
      .withMessage('File ID is required')
  ],
  handleValidationErrors,
  logOperation('DOWNLOAD_FILE'),
  async (req, res) => {
    try {
      const { fileId } = req.params;

      const downloadInfo = await googleDrive.downloadFile(fileId);

      // Set appropriate headers
      res.setHeader('Content-Disposition', `attachment; filename="${downloadInfo.fileName}"`);
      res.setHeader('Content-Type', downloadInfo.mimeType);

      res.send(downloadInfo.buffer);

      logger.info('File downloaded', {
        fileId,
        fileName: downloadInfo.fileName
      });
    } catch (error) {
      logger.error('Failed to download file:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

/**
 * GET /api/drive/download/:fileId/metadata
 * Получение метаданных файла для скачивания
 */
router.get('/download/:fileId/metadata',
  [
    param('fileId')
      .notEmpty()
      .isString()
      .withMessage('File ID is required')
  ],
  handleValidationErrors,
  logOperation('GET_DOWNLOAD_METADATA'),
  async (req, res) => {
    try {
      const { fileId } = req.params;

      const metadata = await googleDrive.getDownloadMetadata(fileId);

      res.json({
        success: true,
        data: metadata,
        message: 'Download metadata retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to get download metadata:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

// ==================== BACKUP ROUTES ====================

/**
 * POST /api/drive/backup/create
 * Создание резервной копии данных
 */
router.post('/backup/create',
  [
    body('backupType')
      .isIn(['full', 'incremental', 'selective'])
      .withMessage('Backup type must be one of: full, incremental, selective'),
    body('dataType')
      .optional()
      .isIn(['conversations', 'training_data', 'media_files', 'all'])
      .withMessage('Data type must be one of: conversations, training_data, media_files, all'),
    body('includeMetadata')
      .optional()
      .isBoolean()
      .withMessage('Include metadata must be a boolean')
  ],
  handleValidationErrors,
  logOperation('CREATE_BACKUP'),
  async (req, res) => {
    try {
      const { backupType, dataType = 'all', includeMetadata = true } = req.body;

      const backup = await googleDrive.createBackup({
        backupType,
        dataType,
        includeMetadata
      });

      logger.info('Backup created', {
        backupId: backup.id,
        backupType,
        dataType
      });

      res.status(201).json({
        success: true,
        data: backup,
        message: 'Backup created successfully'
      });
    } catch (error) {
      logger.error('Failed to create backup:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

/**
 * GET /api/drive/backup/list
 * Получение списка резервных копий
 */
router.get('/backup/list',
  logOperation('LIST_BACKUPS'),
  async (req, res) => {
    try {
      const backups = await googleDrive.listBackups();

      res.json({
        success: true,
        data: backups,
        message: 'Backups retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to list backups:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

/**
 * POST /api/drive/backup/restore
 * Восстановление из резервной копии
 */
router.post('/backup/restore',
  [
    body('backupId')
      .notEmpty()
      .isString()
      .withMessage('Backup ID is required'),
    body('restoreType')
      .isIn(['full', 'partial'])
      .withMessage('Restore type must be one of: full, partial'),
    body('selectiveData')
      .optional()
      .isArray()
      .withMessage('Selective data must be an array')
  ],
  handleValidationErrors,
  logOperation('RESTORE_BACKUP'),
  async (req, res) => {
    try {
      const { backupId, restoreType, selectiveData } = req.body;

      const restore = await googleDrive.restoreBackup({
        backupId,
        restoreType,
        selectiveData
      });

      logger.info('Backup restored', {
        backupId,
        restoreType
      });

      res.json({
        success: true,
        data: restore,
        message: 'Backup restored successfully'
      });
    } catch (error) {
      logger.error('Failed to restore backup:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

// ==================== QUOTA AND USAGE ROUTES ====================

/**
 * GET /api/drive/quota
 * Получение информации о квотах и использовании
 */
router.get('/quota',
  logOperation('GET_QUOTA_INFO'),
  async (req, res) => {
    try {
      const quota = await googleDrive.getQuotaInfo();

      res.json({
        success: true,
        data: quota,
        message: 'Quota information retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to get quota info:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

module.exports = router;