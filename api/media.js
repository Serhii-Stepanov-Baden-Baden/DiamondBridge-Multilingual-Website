const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const sharp = require('sharp');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10 // Max 10 files per request
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mp3|wav|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, videos, audio and documents are allowed.'));
    }
  }
});

// Rate limiting for media endpoint
const mediaLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // limit each IP to 30 media requests per windowMs
  message: {
    error: 'Media rate limit exceeded. Please wait before uploading more files.',
    retryAfter: 300
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
router.use(mediaLimiter);

// Image processing endpoint
router.post('/image/process', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No image file provided'
      });
    }

    const { 
      width, 
      height, 
      quality = 80, 
      format = 'jpeg',
      brightness = 0,
      contrast = 0,
      saturation = 0
    } = req.body;

    let imageProcessor = sharp(req.file.buffer);

    // Resize if dimensions provided
    if (width || height) {
      imageProcessor = imageProcessor.resize(
        width ? parseInt(width) : null,
        height ? parseInt(height) : null,
        { fit: 'inside', withoutEnlargement: true }
      );
    }

    // Apply filters
    if (brightness !== 0) {
      imageProcessor = imageProcessor.modulate({ brightness: 1 + (brightness / 100) });
    }
    if (contrast !== 0) {
      imageProcessor = imageProcessor.linear(1 + (contrast / 100), 0);
    }
    if (saturation !== 0) {
      imageProcessor = imageProcessor.modulate({ saturation: 1 + (saturation / 100) });
    }

    // Convert format and set quality
    const outputBuffer = await imageProcessor
      .jpeg({ quality: parseInt(quality) })
      .toBuffer();

    res.setHeader('Content-Type', `image/${format}`);
    res.setHeader('Content-Length', outputBuffer.length);
    res.send(outputBuffer);

  } catch (error) {
    console.error('Image processing error:', error);
    res.status(500).json({
      error: 'Image processing failed',
      message: error.message
    });
  }
});

// Multiple image processing endpoint
router.post('/image/batch', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No image files provided'
      });
    }

    const { format = 'jpeg', quality = 80 } = req.body;
    const processedImages = [];

    for (const file of req.files) {
      try {
        const processedImage = await sharp(file.buffer)
          .jpeg({ quality: parseInt(quality) })
          .toBuffer();

        processedImages.push({
          originalName: file.originalname,
          size: processedImage.length,
          processedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error(`Error processing ${file.originalname}:`, error);
        processedImages.push({
          originalName: file.originalname,
          error: 'Processing failed',
          message: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        processedCount: processedImages.filter(img => !img.error).length,
        totalCount: req.files.length,
        results: processedImages,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Batch image processing error:', error);
    res.status(500).json({
      error: 'Batch image processing failed',
      message: error.message
    });
  }
});

// Video information endpoint
router.post('/video/info', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No video file provided'
      });
    }

    // Mock video info extraction (in real implementation, use ffprobe)
    const videoInfo = {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      duration: Math.floor(Math.random() * 300) + 10, // Mock duration
      width: 1920,
      height: 1080,
      bitrate: 2500000,
      fps: 30,
      codec: 'H.264',
      audioCodec: 'AAC',
      processedAt: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      data: videoInfo
    });

  } catch (error) {
    console.error('Video info error:', error);
    res.status(500).json({
      error: 'Video analysis failed',
      message: error.message
    });
  }
});

// Audio information endpoint
router.post('/audio/info', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No audio file provided'
      });
    }

    // Mock audio info extraction
    const audioInfo = {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      duration: Math.floor(Math.random() * 300) + 30, // Mock duration
      sampleRate: 44100,
      bitrate: 320,
      channels: 2,
      codec: 'MP3',
      bitDepth: 16,
      processedAt: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      data: audioInfo
    });

  } catch (error) {
    console.error('Audio info error:', error);
    res.status(500).json({
      error: 'Audio analysis failed',
      message: error.message
    });
  }
});

// Media thumbnail generation endpoint
router.post('/thumbnail', upload.single('media'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No media file provided'
      });
    }

    const { width = 200, height = 200 } = req.body;
    let thumbnail;

    if (req.file.mimetype.startsWith('image/')) {
      // Generate image thumbnail
      thumbnail = await sharp(req.file.buffer)
        .resize(parseInt(width), parseInt(height), { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toBuffer();
    } else {
      // For video/audio, return placeholder thumbnail
      thumbnail = await sharp({
        create: {
          width: parseInt(width),
          height: parseInt(height),
          channels: 3,
          background: { r: 128, g: 128, b: 128 }
        }
      })
      .png()
      .toBuffer();
    }

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Length', thumbnail.length);
    res.send(thumbnail);

  } catch (error) {
    console.error('Thumbnail generation error:', error);
    res.status(500).json({
      error: 'Thumbnail generation failed',
      message: error.message
    });
  }
});

// Media format conversion endpoint
router.post('/convert', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided'
      });
    }

    const { format } = req.body;

    if (!format) {
      return res.status(400).json({
        error: 'Target format is required'
      });
    }

    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        error: 'Format conversion is only supported for images'
      });
    }

    let convertedBuffer;
    let contentType = `image/${format}`;

    switch (format.toLowerCase()) {
      case 'jpeg':
      case 'jpg':
        convertedBuffer = await sharp(req.file.buffer).jpeg({ quality: 90 }).toBuffer();
        break;
      case 'png':
        convertedBuffer = await sharp(req.file.buffer).png().toBuffer();
        break;
      case 'webp':
        convertedBuffer = await sharp(req.file.buffer).webp({ quality: 90 }).toBuffer();
        break;
      case 'tiff':
        convertedBuffer = await sharp(req.file.buffer).tiff().toBuffer();
        break;
      default:
        return res.status(400).json({
          error: `Unsupported format: ${format}`
        });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="converted.${format}"`);
    res.send(convertedBuffer);

  } catch (error) {
    console.error('Format conversion error:', error);
    res.status(500).json({
      error: 'Format conversion failed',
      message: error.message
    });
  }
});

module.exports = router;