#!/usr/bin/env node

/**
 * DiamondBridge - Central Application Entry Point
 * Autonomous Semantic Memory Framework AI Agent Backend
 * 
 * Author: Serhii Stepanov
 * Version: 1.0.0
 * License: MIT
 * 
 * This is the main entry point for the DiamondBridge backend application.
 * It initializes and configures all modules, sets up Express server,
 * and coordinates the integration between AI core, ASMF engine, and Google Drive.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Import configuration and utilities
const config = require('./config');
const logger = require('./utils/logger');
const errorHandler = require('./utils/error-handler');

// Import core modules
const aiCore = require('./ai-core');
const asmfEngine = require('./asmf-engine');
const googleDrive = require('./google-drive');

// Import routes
const aiRoutes = require('./routes/ai');
const mediaRoutes = require('./routes/media');
const driveRoutes = require('./routes/drive');
const configRoutes = require('./routes/config');

// Import middleware
const authMiddleware = require('./middleware/auth');
const validationMiddleware = require('./middleware/validation');
const rateLimitMiddleware = require('./middleware/rate-limit');
const loggingMiddleware = require('./middleware/logging');

/**
 * Main Application Class
 */
class DiamondBridgeApp {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3001;
    this.initializedModules = {
      aiCore: false,
      asmfEngine: false,
      googleDrive: false,
      config: false
    };
  }

  /**
   * Initialize the application
   */
  async initialize() {
    try {
      logger.info('🚀 Initializing DiamondBridge Backend...');
      
      // Initialize configuration first
      await this.initializeConfig();
      
      // Initialize core modules
      await this.initializeModules();
      
      // Setup Express middleware
      this.setupMiddleware();
      
      // Setup API routes
      this.setupRoutes();
      
      // Setup error handling
      this.setupErrorHandling();
      
      // Health check endpoints
      this.setupHealthChecks();
      
      logger.info('✅ DiamondBridge Backend initialized successfully');
      
    } catch (error) {
      logger.error('❌ Failed to initialize DiamondBridge Backend:', error);
      process.exit(1);
    }
  }

  /**
   * Initialize configuration system
   */
  async initializeConfig() {
    try {
      logger.info('📋 Loading configuration...');
      await config.load();
      this.initializedModules.config = true;
      logger.info('✅ Configuration loaded successfully');
    } catch (error) {
      logger.error('❌ Configuration loading failed:', error);
      throw error;
    }
  }

  /**
   * Initialize all core modules
   */
  async initializeModules() {
    try {
      logger.info('🧠 Initializing ASMF Engine...');
      await asmfEngine.initialize();
      this.initializedModules.asmfEngine = true;
      logger.info('✅ ASMF Engine initialized');

      logger.info('🤖 Initializing AI Core...');
      await aiCore.initialize();
      this.initializedModules.aiCore = true;
      logger.info('✅ AI Core initialized');

      logger.info('☁️ Initializing Google Drive Integration...');
      await googleDrive.initialize();
      this.initializedModules.googleDrive = true;
      logger.info('✅ Google Drive Integration initialized');

    } catch (error) {
      logger.error('❌ Module initialization failed:', error);
      throw error;
    }
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    logger.info('⚙️ Setting up Express middleware...');
    
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"]
        }
      },
      crossOriginEmbedderPolicy: false
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Custom middleware
    this.app.use(loggingMiddleware);
    this.app.use(rateLimitMiddleware);
    
    // Static file serving
    this.app.use('/static', express.static(path.join(__dirname, 'public')));
    
    logger.info('✅ Middleware setup complete');
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    logger.info('🛣️ Setting up API routes...');
    
    // API routes
    this.app.use('/api/ai', authMiddleware, aiRoutes);
    this.app.use('/api/media', authMiddleware, validationMiddleware, mediaRoutes);
    this.app.use('/api/drive', authMiddleware, googleDrive.authMiddleware, driveRoutes);
    this.app.use('/api/config', authMiddleware, configRoutes);
    
    // Health and status routes (no auth required)
    this.app.use('/api/health', require('./routes/health'));
    this.app.use('/api/status', require('./routes/status'));
    
    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        name: 'DiamondBridge Backend',
        version: '1.0.0',
        description: 'Autonomous Semantic Memory Framework AI Agent',
        author: 'Serhii Stepanov',
        status: 'running',
        timestamp: new Date().toISOString(),
        modules: this.initializedModules
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
      });
    });

    logger.info('✅ Routes setup complete');
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    this.app.use(errorHandler);
    
    // Graceful shutdown
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.gracefulShutdown('unhandledRejection');
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      this.gracefulShutdown('uncaughtException');
    });
    
    logger.info('✅ Error handling setup complete');
  }

  /**
   * Setup health check endpoints
   */
  setupHealthChecks() {
    // Detailed health check
    this.app.get('/health', async (req, res) => {
      try {
        const health = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          modules: this.initializedModules,
          checks: {}
        };

        // Check AI Core
        health.checks.aiCore = await aiCore.healthCheck();
        
        // Check ASMF Engine
        health.checks.asmfEngine = await asmfEngine.healthCheck();
        
        // Check Google Drive
        health.checks.googleDrive = await googleDrive.healthCheck();

        res.json(health);
      } catch (error) {
        res.status(503).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error.message
        });
      }
    });
  }

  /**
   * Graceful shutdown handler
   */
  async gracefulShutdown(signal) {
    logger.info(`🔄 Graceful shutdown initiated: ${signal}`);
    
    try {
      // Close server
      if (this.server) {
        await new Promise((resolve) => {
          this.server.close(resolve);
        });
        logger.info('✅ HTTP server closed');
      }

      // Cleanup modules
      if (this.initializedModules.asmfEngine) {
        await asmfEngine.cleanup();
        logger.info('✅ ASMF Engine cleaned up');
      }

      if (this.initializedModules.aiCore) {
        await aiCore.cleanup();
        logger.info('✅ AI Core cleaned up');
      }

      if (this.initializedModules.googleDrive) {
        await googleDrive.cleanup();
        logger.info('✅ Google Drive cleaned up');
      }

      logger.info('✅ Graceful shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }

  /**
   * Start the server
   */
  async start() {
    await this.initialize();
    
    this.server = this.app.listen(this.port, () => {
      logger.info(`🌟 DiamondBridge Backend is running on port ${this.port}`);
      logger.info(`📝 API Documentation: http://localhost:${this.port}/api/docs`);
      logger.info(`🔍 Health Check: http://localhost:${this.port}/health`);
      logger.info(`🚀 Ready to accept connections!`);
    });

    return this.server;
  }
}

// Create and start application
const app = new DiamondBridgeApp();

// Start server if this file is run directly
if (require.main === module) {
  app.start().catch(error => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}

module.exports = app;
