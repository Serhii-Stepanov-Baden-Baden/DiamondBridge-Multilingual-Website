// Google Drive Service for Vercel API Routes
const { google } = require('googleapis');

class GoogleDriveService {
  constructor() {
    this.drive = null;
    this.auth = null;
  }

  async initialize(accessToken) {
    try {
      this.auth = new google.auth.OAuth2();
      this.auth.setCredentials({ access_token: accessToken });
      
      this.drive = google.drive({ version: 'v3', auth: this.auth });
      return true;
    } catch (error) {
      console.error('Google Drive service initialization failed:', error);
      throw new Error('Failed to initialize Google Drive service');
    }
  }

  async listFiles(options = {}) {
    try {
      const {
        pageSize = 20,
        pageToken,
        folderId,
        searchQuery,
        orderBy = 'name'
      } = options;

      const query = [];
      
      if (folderId) {
        query.push(`'${folderId}' in parents`);
      }
      
      if (searchQuery) {
        query.push(`name contains '${searchQuery}'`);
      }
      
      // Only get files not in trash
      query.push('trashed = false');

      const response = await this.drive.files.list({
        q: query.length > 1 ? query.join(' and ') : query[0],
        pageSize: parseInt(pageSize),
        pageToken,
        orderBy: `${orderBy} asc`,
        fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, parents, owners, permissions, thumbnailLink, webViewLink)'
      });

      return {
        files: response.data.files || [],
        nextPageToken: response.data.nextPageToken
      };
    } catch (error) {
      console.error('List files error:', error);
      throw new Error('Failed to list files from Google Drive');
    }
  }

  async uploadFile(options = {}) {
    try {
      const {
        fileName,
        fileContent,
        fileType,
        folderId,
        isPublic = false,
        description = ''
      } = options;

      const fileMetadata = {
        name: fileName,
        description: description
      };

      if (folderId) {
        fileMetadata.parents = [folderId];
      }

      const media = {
        mimeType: fileType || 'application/octet-stream',
        body: Buffer.isBuffer(fileContent) ? fileContent : Buffer.from(fileContent)
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, permissions'
      });

      const file = response.data;

      // Set permissions if public
      if (isPublic) {
        await this.drive.permissions.create({
          fileId: file.id,
          requestBody: {
            role: 'reader',
            type: 'anyone'
          }
        });
      }

      return {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
        thumbnailLink: file.thumbnailLink,
        isPublic: isPublic
      };
    } catch (error) {
      console.error('Upload file error:', error);
      throw new Error('Failed to upload file to Google Drive');
    }
  }

  async downloadFile(fileId, format) {
    try {
      // Get file metadata first
      const fileMetadata = await this.drive.files.get({
        fileId: fileId,
        fields: 'id, name, mimeType, size'
      });

      const file = fileMetadata.data;
      let response;

      if (format) {
        // Export Google Docs files
        if (file.mimeType.startsWith('application/vnd.google-apps')) {
          let exportMimeType;
          switch (format.toLowerCase()) {
            case 'pdf':
              exportMimeType = 'application/pdf';
              break;
            case 'docx':
              exportMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
              break;
            case 'xlsx':
              exportMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
              break;
            default:
              exportMimeType = 'text/plain';
          }

          response = await this.drive.files.export({
            fileId: fileId,
            mimeType: exportMimeType
          }, { responseType: 'arraybuffer' });
        } else {
          // Download regular files with format conversion
          response = await this.drive.files.get({
            fileId: fileId,
            alt: 'media'
          }, { responseType: 'arraybuffer' });
        }
      } else {
        // Download original file
        response = await this.drive.files.get({
          fileId: fileId,
          alt: 'media'
        }, { responseType: 'arraybuffer' });
      }

      return {
        content: Buffer.from(response.data),
        fileName: file.name,
        mimeType: format ? this.getMimeTypeForFormat(format) : file.mimeType,
        originalMimeType: file.mimeType
      };
    } catch (error) {
      console.error('Download file error:', error);
      throw new Error('Failed to download file from Google Drive');
    }
  }

  async deleteFile(fileId) {
    try {
      await this.drive.files.delete({
        fileId: fileId
      });
      return true;
    } catch (error) {
      console.error('Delete file error:', error);
      throw new Error('Failed to delete file from Google Drive');
    }
  }

  async moveToTrash(fileId) {
    try {
      await this.drive.files.update({
        fileId: fileId,
        requestBody: {
          trashed: true
        }
      });
      return true;
    } catch (error) {
      console.error('Move to trash error:', error);
      throw new Error('Failed to move file to trash');
    }
  }

  async createFolder(options = {}) {
    try {
      const { name, parentId, description = '' } = options;

      const fileMetadata = {
        name: name,
        mimeType: 'application/vnd.google-apps.folder',
        description: description
      };

      if (parentId) {
        fileMetadata.parents = [parentId];
      }

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        fields: 'id, name, createdTime, modifiedTime, parents, webViewLink'
      });

      const folder = response.data;

      return {
        id: folder.id,
        name: folder.name,
        createdTime: folder.createdTime,
        modifiedTime: folder.modifiedTime,
        parents: folder.parents || [],
        webViewLink: folder.webViewLink
      };
    } catch (error) {
      console.error('Create folder error:', error);
      throw new Error('Failed to create folder in Google Drive');
    }
  }

  async shareFile(options = {}) {
    try {
      const {
        fileId,
        email,
        role = 'reader',
        type = 'user',
        sendNotificationEmail = false
      } = options;

      const response = await this.drive.permissions.create({
        fileId: fileId,
        sendNotificationEmail: sendNotificationEmail,
        requestBody: {
          role: role,
          type: type,
          emailAddress: email
        },
        fields: 'id, role, type, emailAddress, displayName'
      });

      const permission = response.data;

      return {
        id: permission.id,
        role: permission.role,
        type: permission.type,
        emailAddress: permission.emailAddress,
        displayName: permission.displayName
      };
    } catch (error) {
      console.error('Share file error:', error);
      throw new Error('Failed to share file in Google Drive');
    }
  }

  async getFileMetadata(fileId) {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        fields: 'id, name, mimeType, size, createdTime, modifiedTime, parents, owners, permissions, webViewLink, webContentLink, thumbnailLink, description, trashed'
      });

      return response.data;
    } catch (error) {
      console.error('Get file metadata error:', error);
      throw new Error('Failed to get file metadata from Google Drive');
    }
  }

  async searchFiles(options = {}) {
    try {
      const {
        query,
        fileType,
        owner = 'me',
        pageSize = 20,
        pageToken
      } = options;

      let searchQuery = `name contains '${query}' and trashed = false`;

      if (fileType) {
        if (fileType === 'folder') {
          searchQuery += " and mimeType = 'application/vnd.google-apps.folder'";
        } else {
          searchQuery += ` and mimeType = '${fileType}'`;
        }
      }

      if (owner !== 'all') {
        searchQuery += ` and '${owner}' in owners`;
      }

      const response = await this.drive.files.list({
        q: searchQuery,
        pageSize: parseInt(pageSize),
        pageToken,
        orderBy: 'relevance desc',
        fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, parents, owners, permissions, thumbnailLink, webViewLink)'
      });

      return {
        files: response.data.files || [],
        nextPageToken: response.data.nextPageToken
      };
    } catch (error) {
      console.error('Search files error:', error);
      throw new Error('Failed to search files in Google Drive');
    }
  }

  async getStorageQuota() {
    try {
      const response = await this.drive.about.get({
        fields: 'storageQuota'
      });

      const quota = response.data.storageQuota;

      return {
        limit: parseInt(quota.limit),
        usage: parseInt(quota.usage),
        usageInDrive: parseInt(quota.usageInDrive),
        usageInDriveTrash: parseInt(quota.usageInDriveTrash)
      };
    } catch (error) {
      console.error('Get storage quota error:', error);
      throw new Error('Failed to get storage quota from Google Drive');
    }
  }

  getMimeTypeForFormat(format) {
    const mimeTypes = {
      'pdf': 'application/pdf',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'txt': 'text/plain',
      'csv': 'text/csv',
      'rtf': 'application/rtf'
    };

    return mimeTypes[format.toLowerCase()] || 'application/octet-stream';
  }
}

module.exports = { GoogleDriveService };