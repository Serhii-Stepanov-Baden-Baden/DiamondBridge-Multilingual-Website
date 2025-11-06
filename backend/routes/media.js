#!/usr/bin/env node

/**
 * DiamondBridge Media Routes
 * Autonomous Semantic Memory Framework AI Agent Backend
 * 
 * API маршруты для медиа обработки:
 * - upload: загрузка и обработка медиа файлов
 * - process: обработка изображений, аудио, видео
 * - analyze: анализ медиа контента
 * - transform: преобразование медиа форматов
 * 
 * Author: Serhii Stepanov
 * Version: 1.0.0
 * License: MIT
 */

const express = require('express');
const multer = require('multer');
const { body, param, query, validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Import modules
const aiCore = require('../ai-core');
const logger = require('../utils/logger');
const { ApiError } = require('../utils/error-handler');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 10 // Maximum 10 files per request
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp3|wav|ogg|mp4|avi|mov|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, audio and video files are allowed.'));
    }
  }
});

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
    logger.info(`Media Operation: ${operation}`, {
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
      requestId: req.id,
      filesCount: req.files?.length || 0
    });
    next();
  };
};

// ==================== UPLOAD ROUTES ====================

/**
 * POST /api/media/upload
 * Загрузка медиа файлов
 */
router.post('/upload',
  upload.array('files', 10),
  [
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
  logOperation('MEDIA_UPLOAD'),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        throw new ApiError('No files uploaded', 'NO_FILES', 400);
      }

      const { language = 'en', metadata = {} } = req.body;
      const uploadResults = [];

      for (const file of req.files) {
        try {
          const result = await processUploadedFile(file, language, metadata);
          uploadResults.push(result);
        } catch (error) {
          logger.error(`Failed to process file ${file.originalname}:`, error);
          uploadResults.push({
            fileName: file.originalname,
            success: false,
            error: error.message
          });
        }
      }

      const successful = uploadResults.filter(r => r.success);
      const failed = uploadResults.filter(r => !r.success);

      logger.info('Media upload completed', {
        totalFiles: req.files.length,
        successful: successful.length,
        failed: failed.length
      });

      res.status(201).json({
        success: true,
        data: {
          results: uploadResults,
          summary: {
            total: req.files.length,
            successful: successful.length,
            failed: failed.length
          }
        },
        message: `${successful.length} files uploaded successfully`
      });
    } catch (error) {
      logger.error('Failed to upload media files:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

/**
 * POST /api/media/upload/image
 * Специализированная загрузка изображений
 */
router.post('/upload/image',
  upload.single('image'),
  [
    body('analysisType')
      .optional()
      .isIn(['basic', 'detailed', 'objects', 'text'])
      .withMessage('Analysis type must be one of: basic, detailed, objects, text'),
    body('language')
      .optional()
      .isIn(['en', 'ru', 'ua'])
      .withMessage('Language must be one of: en, ru, ua')
  ],
  handleValidationErrors,
  logOperation('IMAGE_UPLOAD'),
  async (req, res) => {
    try {
      if (!req.file) {
        throw new ApiError('No image file uploaded', 'NO_IMAGE', 400);
      }

      const { analysisType = 'detailed', language = 'en' } = req.body;
      
      const result = await aiCore.mediaProcessor.processImage(req.file.buffer, {
        fileName: req.file.originalname,
        analysisType,
        language
      });

      logger.info('Image processed', {
        fileName: req.file.originalname,
        analysisType,
        language
      });

      res.status(201).json({
        success: true,
        data: result,
        message: 'Image processed successfully'
      });
    } catch (error) {
      logger.error('Failed to process image:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

/**
 * POST /api/media/upload/audio
 * Специализированная загрузка аудио
 */
router.post('/upload/audio',
  upload.single('audio'),
  [
    body('transcription')
      .optional()
      .isBoolean()
      .withMessage('Transcription must be a boolean'),
    body('language')
      .optional()
      .isIn(['en', 'ru', 'ua'])
      .withMessage('Language must be one of: en, ru, ua')
  ],
  handleValidationErrors,
  logOperation('AUDIO_UPLOAD'),
  async (req, res) => {
    try {
      if (!req.file) {
        throw new ApiError('No audio file uploaded', 'NO_AUDIO', 400);
      }

      const { transcription = true, language = 'en' } = req.body;
      
      const result = await aiCore.mediaProcessor.processAudio(req.file.buffer, {
        fileName: req.file.originalname,
        transcription,
        language
      });

      logger.info('Audio processed', {
        fileName: req.file.originalname,
        transcription,
        language
      });

      res.status(201).json({
        success: true,
        data: result,
        message: 'Audio processed successfully'
      });
    } catch (error) {
      logger.error('Failed to process audio:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

/**
 * POST /api/media/upload/video
 * Специализированная загрузка видео
 */
router.post('/upload/video',
  upload.single('video'),
  [
    body('extractFrames')
      .optional()
      .isBoolean()
      .withMessage('Extract frames must be a boolean'),
    body('extractAudio')
      .optional()
      .isBoolean()
      .withMessage('Extract audio must be a boolean'),
    body('language')
      .optional()
      .isIn(['en', 'ru', 'ua'])
      .withMessage('Language must be one of: en, ru, ua')
  ],
  handleValidationErrors,
  logOperation('VIDEO_UPLOAD'),
  async (req, res) => {
    try {
      if (!req.file) {
        throw new ApiError('No video file uploaded', 'NO_VIDEO', 400);
      }

      const { extractFrames = true, extractAudio = true, language = 'en' } = req.body;
      
      const result = await aiCore.mediaProcessor.processVideo(req.file.buffer, {
        fileName: req.file.originalname,
        extractFrames,
        extractAudio,
        language
      });

      logger.info('Video processed', {
        fileName: req.file.originalname,
        extractFrames,
        extractAudio,
        language
      });

      res.status(201).json({
        success: true,
        data: result,
        message: 'Video processed successfully'
      });
    } catch (error) {
      logger.error('Failed to process video:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

// ==================== PROCESSING ROUTES ====================

/**
 * POST /api/media/process/image
 * Обработка изображения по URL или base64
 */
router.post('/process/image',
  [
    body('imageData')
      .notEmpty()
      .withMessage('Image data (URL or base64) is required'),
    body('imageType')
      .isIn(['url', 'base64', 'buffer'])
      .withMessage('Image type must be one of: url, base64, buffer'),
    body('analysisType')
      .optional()
      .isIn(['basic', 'detailed', 'objects', 'text', 'faces'])
      .withMessage('Analysis type must be one of: basic, detailed, objects, text, faces'),
    body('language')
      .optional()
      .isIn(['en', 'ru', 'ua'])
      .withMessage('Language must be one of: en, ru, ua')
  ],
  handleValidationErrors,
  logOperation('IMAGE_PROCESSING'),
  async (req, res) => {
    try {
      const { imageData, imageType, analysisType = 'detailed', language = 'en' } = req.body;

      const result = await aiCore.mediaProcessor.analyzeImage({
        imageData,
        imageType,
        analysisType,
        language
      });

      logger.info('Image analysis completed', {
        imageType,
        analysisType,
        language
      });

      res.json({
        success: true,
        data: result,
        message: 'Image processed successfully'
      });
    } catch (error) {
      logger.error('Failed to process image:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

/**
 * POST /api/media/process/video
 * Обработка видео для извлечения кадров и аудио
 */
router.post('/process/video',
  [
    body('videoData')
      .notEmpty()
      .withMessage('Video data is required'),
    body('videoType')
      .isIn(['url', 'buffer'])
      .withMessage('Video type must be one of: url, buffer'),
    body('frameExtraction')
      .optional()
      .isObject()
      .withMessage('Frame extraction options must be an object'),
    body('audioExtraction')
      .optional()
      .isBoolean()
      .withMessage('Audio extraction must be a boolean')
  ],
  handleValidationErrors,
  logOperation('VIDEO_PROCESSING'),
  async (req, res) => {
    try {
      const { videoData, videoType, frameExtraction = {}, audioExtraction = true } = req.body;

      const result = await aiCore.mediaProcessor.processVideoContent({
        videoData,
        videoType,
        frameExtraction,
        audioExtraction
      });

      logger.info('Video processing completed', {
        videoType,
        frameCount: result.frames?.length || 0,
        audioExtracted: audioExtraction
      });

      res.json({
        success: true,
        data: result,
        message: 'Video processed successfully'
      });
    } catch (error) {
      logger.error('Failed to process video:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

/**
 * POST /api/media/process/audio
 * Обработка аудио для транскрипции и анализа
 */
router.post('/process/audio',
  [
    body('audioData')
      .notEmpty()
      .withMessage('Audio data is required'),
    body('audioType')
      .isIn(['url', 'buffer'])
      .withMessage('Audio type must be one of: url, buffer'),
    body('transcription')
      .optional()
      .isBoolean()
      .withMessage('Transcription must be a boolean'),
    body('sentimentAnalysis')
      .optional()
      .isBoolean()
      .withMessage('Sentiment analysis must be a boolean'),
    body('language')
      .optional()
      .isIn(['en', 'ru', 'ua'])
      .withMessage('Language must be one of: en, ru, ua')
  ],
  handleValidationErrors,
  logOperation('AUDIO_PROCESSING'),
  async (req, res) => {
    try {
      const { 
        audioData, 
        audioType, 
        transcription = true, 
        sentimentAnalysis = false,
        language = 'en' 
      } = req.body;

      const result = await aiCore.mediaProcessor.processAudioContent({
        audioData,
        audioType,
        transcription,
        sentimentAnalysis,
        language
      });

      logger.info('Audio processing completed', {
        audioType,
        transcription,
        sentimentAnalysis,
        language
      });

      res.json({
        success: true,
        data: result,
        message: 'Audio processed successfully'
      });
    } catch (error) {
      logger.error('Failed to process audio:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

// ==================== ANALYSIS ROUTES ====================

/**
 * POST /api/media/analyze/objects
 * Детекция объектов в изображении
 */
router.post('/analyze/objects',
  [
    body('imageData')
      .notEmpty()
      .withMessage('Image data is required'),
    body('confidence')
      .optional()
      .isFloat({ min: 0, max: 1 })
      .withMessage('Confidence must be between 0 and 1')
  ],
  handleValidationErrors,
  logOperation('OBJECT_DETECTION'),
  async (req, res) => {
    try {
      const { imageData, confidence = 0.5 } = req.body;

      const result = await aiCore.mediaProcessor.detectObjects(imageData, { confidence });

      logger.info('Object detection completed', {
        objectCount: result.objects?.length || 0,
        confidence
      });

      res.json({
        success: true,
        data: result,
        message: 'Object detection completed'
      });
    } catch (error) {
      logger.error('Failed to detect objects:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

/**
 * POST /api/media/analyze/faces
 * Детекция и анализ лиц
 */
router.post('/analyze/faces',
  [
    body('imageData')
      .notEmpty()
      .withMessage('Image data is required'),
    body('analyzeEmotions')
      .optional()
      .isBoolean()
      .withMessage('Analyze emotions must be a boolean'),
    body('analyzeAge')
      .optional()
      .isBoolean()
      .withMessage('Analyze age must be a boolean')
  ],
  handleValidationErrors,
  logOperation('FACE_ANALYSIS'),
  async (req, res) => {
    try {
      const { imageData, analyzeEmotions = true, analyzeAge = true } = req.body;

      const result = await aiCore.mediaProcessor.analyzeFaces(imageData, {
        analyzeEmotions,
        analyzeAge
      });

      logger.info('Face analysis completed', {
        faceCount: result.faces?.length || 0,
        analyzeEmotions,
        analyzeAge
      });

      res.json({
        success: true,
        data: result,
        message: 'Face analysis completed'
      });
    } catch (error) {
      logger.error('Failed to analyze faces:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

/**
 * POST /api/media/analyze/text
 * Извлечение текста из изображений (OCR)
 */
router.post('/analyze/text',
  [
    body('imageData')
      .notEmpty()
      .withMessage('Image data is required'),
    body('language')
      .optional()
      .isIn(['en', 'ru', 'ua', 'eng', 'rus'])
      .withMessage('Language must be one of: en, ru, ua, eng, rus'),
    body('enhanceImage')
      .optional()
      .isBoolean()
      .withMessage('Enhance image must be a boolean')
  ],
  handleValidationErrors,
  logOperation('TEXT_EXTRACTION'),
  async (req, res) => {
    try {
      const { imageData, language = 'en', enhanceImage = false } = req.body;

      const result = await aiCore.mediaProcessor.extractText(imageData, {
        language,
        enhanceImage
      });

      logger.info('Text extraction completed', {
        textLength: result.text?.length || 0,
        language,
        enhanceImage
      });

      res.json({
        success: true,
        data: result,
        message: 'Text extraction completed'
      });
    } catch (error) {
      logger.error('Failed to extract text:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

// ==================== TRANSFORM ROUTES ====================

/**
 * POST /api/media/transform/image
 * Трансформация изображений
 */
router.post('/transform/image',
  [
    body('imageData')
      .notEmpty()
      .withMessage('Image data is required'),
    body('transformations')
      .isArray()
      .withMessage('Transformations must be an array'),
    body('transformations.*.type')
      .isIn(['resize', 'crop', 'rotate', 'filter', 'enhance'])
      .withMessage('Invalid transformation type'),
    body('outputFormat')
      .optional()
      .isIn(['jpeg', 'png', 'webp'])
      .withMessage('Output format must be one of: jpeg, png, webp')
  ],
  handleValidationErrors,
  logOperation('IMAGE_TRANSFORMATION'),
  async (req, res) => {
    try {
      const { imageData, transformations, outputFormat = 'jpeg' } = req.body;

      const result = await aiCore.mediaProcessor.transformImage(imageData, {
        transformations,
        outputFormat
      });

      logger.info('Image transformation completed', {
        transformationCount: transformations.length,
        outputFormat
      });

      res.json({
        success: true,
        data: result,
        message: 'Image transformed successfully'
      });
    } catch (error) {
      logger.error('Failed to transform image:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  }
);

/**
 * POST /api/media/transform/video
 * Конвертация видео форматов
 */
router.post('/transform/video',
  [
    body('videoData')
      .notEmpty()
      .withMessage('Video data is required'),
    body('outputFormat')
      .isIn(['mp4', 'avi', 'mov', 'webm'])
      .withMessage('Output format must be one of: mp4, avi, mov, webm'),
    body('quality')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Quality must be one of: low, medium, high'),
    body('compression')
      .optional()
      .isFloat({ min: 0.1, max: 1.0 })
      .withMessage('Compression must be between 0.1 and 1.0')
  ],
  handleValidationErrors,
  logOperation('VIDEO_TRANSFORMATION'),
  async (req, res) => {
    try {
      const { videoData, outputFormat, quality = 'medium', compression = 0.8 } = req.body;

      const result = await aiCore.mediaProcessor.transformVideo(videoData, {
        outputFormat,
        quality,
        compression
      });

      logger.info('Video transformation completed', {
        outputFormat,
        quality,
        compression
      });

      res.json({
        success: true,
        data: result,
        message: 'Video transformed successfully'
      });
    } catch (error) {
      logger.error('Failed to transform video:', error);
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
 * Process uploaded file based on type
 */
async function processUploadedFile(file, language, metadata) {
  const fileType = getFileType(file);
  const result = {
    fileName: file.originalname,
    fileSize: file.size,
    fileType,
    success: true,
    timestamp: new Date().toISOString()
  };

  try {
    switch (fileType) {
      case 'image':
        result.data = await aiCore.mediaProcessor.processImage(file.buffer, {
          fileName: file.originalname,
          language,
          metadata
        });
        break;
      
      case 'audio':
        result.data = await aiCore.mediaProcessor.processAudio(file.buffer, {
          fileName: file.originalname,
          language,
          metadata
        });
        break;
      
      case 'video':
        result.data = await aiCore.mediaProcessor.processVideo(file.buffer, {
          fileName: file.originalname,
          language,
          metadata
        });
        break;
      
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    result.message = `${fileType.charAt(0).toUpperCase() + fileType.slice(1)} processed successfully`;
    return result;
  } catch (error) {
    result.success = false;
    result.error = error.message;
    return result;
  }
}

/**
 * Determine file type from mimetype
 */
function getFileType(file) {
  const mimeType = file.mimetype;
  
  if (mimeType.startsWith('image/')) {
    return 'image';
  } else if (mimeType.startsWith('audio/')) {
    return 'audio';
  } else if (mimeType.startsWith('video/')) {
    return 'video';
  } else {
    return 'unknown';
  }
}

module.exports = router;
