const express = require('express');
const rateLimit = require('express-rate-limit');
const { GoogleDriveService } = require('./services/googleDriveService');

const router = express.Router();
const driveService = new GoogleDriveService();

// Rate limiting for drive endpoint
const driveLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // limit each IP to 50 drive requests per windowMs
  message: {
    error: 'Drive rate limit exceeded. Please wait before making more requests.',
    retryAfter: 300
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
router.use(driveLimiter);

// Initialize Google Drive service
router.post('/init', async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        error: 'Access token is required'
      });
    }

    await driveService.initialize(accessToken);

    res.status(200).json({
      success: true,
      message: 'Google Drive service initialized',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Drive init error:', error);
    res.status(500).json({
      error: 'Failed to initialize Google Drive service',
      message: error.message
    });
  }
});

// List files from Google Drive
router.get('/files', async (req, res) => {
  try {
    const { 
      pageSize = 20, 
      pageToken, 
      folderId, 
      searchQuery,
      orderBy = 'name' 
    } = req.query;

    const accessToken = req.headers.authorization?.replace('Bearer ', '');

    if (!accessToken) {
      return res.status(401).json({
        error: 'Access token is required'
      });
    }

    await driveService.initialize(accessToken);

    const files = await driveService.listFiles({
      pageSize: parseInt(pageSize),
      pageToken,
      folderId,
      searchQuery,
      orderBy
    });

    res.status(200).json({
      success: true,
      data: files,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({
      error: 'Failed to list files',
      message: error.message
    });
  }
});

// Upload file to Google Drive
router.post('/upload', async (req, res) => {
  try {
    const { 
      fileName, 
      fileContent, 
      fileType, 
      folderId,
      isPublic = false,
      description = ''
    } = req.body;

    const accessToken = req.headers.authorization?.replace('Bearer ', '');

    if (!accessToken) {
      return res.status(401).json({
        error: 'Access token is required'
      });
    }

    if (!fileName || !fileContent) {
      return res.status(400).json({
        error: 'File name and content are required'
      });
    }

    await driveService.initialize(accessToken);

    const uploadedFile = await driveService.uploadFile({
      fileName,
      fileContent: Buffer.from(fileContent, 'base64'),
      fileType,
      folderId,
      isPublic,
      description
    });

    res.status(200).json({
      success: true,
      data: uploadedFile,
      message: 'File uploaded successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      error: 'Failed to upload file',
      message: error.message
    });
  }
});

// Download file from Google Drive
router.get('/download/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { format } = req.query;

    const accessToken = req.headers.authorization?.replace('Bearer ', '');

    if (!accessToken) {
      return res.status(401).json({
        error: 'Access token is required'
      });
    }

    await driveService.initialize(accessToken);

    const fileData = await driveService.downloadFile(fileId, format);

    res.setHeader('Content-Type', fileData.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileData.fileName}"`);
    res.send(fileData.content);

  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({
      error: 'Failed to download file',
      message: error.message
    });
  }
});

// Delete file from Google Drive
router.delete('/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { permanently = false } = req.body;

    const accessToken = req.headers.authorization?.replace('Bearer ', '');

    if (!accessToken) {
      return res.status(401).json({
        error: 'Access token is required'
      });
    }

    await driveService.initialize(accessToken);

    if (permanently) {
      await driveService.deleteFile(fileId);
    } else {
      await driveService.moveToTrash(fileId);
    }

    res.status(200).json({
      success: true,
      message: `File ${permanently ? 'deleted' : 'moved to trash'} successfully`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({
      error: 'Failed to delete file',
      message: error.message
    });
  }
});

// Create folder in Google Drive
router.post('/folders', async (req, res) => {
  try {
    const { name, parentId, description = '' } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Folder name is required'
      });
    }

    const accessToken = req.headers.authorization?.replace('Bearer ', '');

    if (!accessToken) {
      return res.status(401).json({
        error: 'Access token is required'
      });
    }

    await driveService.initialize(accessToken);

    const folder = await driveService.createFolder({
      name,
      parentId,
      description
    });

    res.status(200).json({
      success: true,
      data: folder,
      message: 'Folder created successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Folder creation error:', error);
    res.status(500).json({
      error: 'Failed to create folder',
      message: error.message
    });
  }
});

// Share file/folder
router.post('/share', async (req, res) => {
  try {
    const { 
      fileId, 
      email, 
      role = 'reader', 
      type = 'user',
      sendNotificationEmail = false
    } = req.body;

    if (!fileId || !email) {
      return res.status(400).json({
        error: 'File ID and email are required'
      });
    }

    const accessToken = req.headers.authorization?.replace('Bearer ', '');

    if (!accessToken) {
      return res.status(401).json({
        error: 'Access token is required'
      });
    }

    await driveService.initialize(accessToken);

    const permission = await driveService.shareFile({
      fileId,
      email,
      role,
      type,
      sendNotificationEmail
    });

    res.status(200).json({
      success: true,
      data: permission,
      message: 'File shared successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('File sharing error:', error);
    res.status(500).json({
      error: 'Failed to share file',
      message: error.message
    });
  }
});

// Get file metadata
router.get('/files/:fileId/metadata', async (req, res) => {
  try {
    const { fileId } = req.params;

    const accessToken = req.headers.authorization?.replace('Bearer ', '');

    if (!accessToken) {
      return res.status(401).json({
        error: 'Access token is required'
      });
    }

    await driveService.initialize(accessToken);

    const metadata = await driveService.getFileMetadata(fileId);

    res.status(200).json({
      success: true,
      data: metadata,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get metadata error:', error);
    res.status(500).json({
      error: 'Failed to get file metadata',
      message: error.message
    });
  }
});

// Search files
router.get('/search', async (req, res) => {
  try {
    const { 
      query, 
      fileType, 
      owner = 'me',
      pageSize = 20,
      pageToken
    } = req.query;

    const accessToken = req.headers.authorization?.replace('Bearer ', '');

    if (!accessToken) {
      return res.status(401).json({
        error: 'Access token is required'
      });
    }

    if (!query) {
      return res.status(400).json({
        error: 'Search query is required'
      });
    }

    await driveService.initialize(accessToken);

    const results = await driveService.searchFiles({
      query,
      fileType,
      owner,
      pageSize: parseInt(pageSize),
      pageToken
    });

    res.status(200).json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Search files error:', error);
    res.status(500).json({
      error: 'Failed to search files',
      message: error.message
    });
  }
});

// Get storage quota
router.get('/quota', async (req, res) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');

    if (!accessToken) {
      return res.status(401).json({
        error: 'Access token is required'
      });
    }

    await driveService.initialize(accessToken);

    const quota = await driveService.getStorageQuota();

    res.status(200).json({
      success: true,
      data: quota,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get quota error:', error);
    res.status(500).json({
      error: 'Failed to get storage quota',
      message: error.message
    });
  }
});

module.exports = router;