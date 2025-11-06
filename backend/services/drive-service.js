const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');
const mime = require('mime');
const logger = require('../utils/logger');

class DriveService {
  constructor() {
    this.drive = google.drive({ version: 'v3' });
    this.auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.readonly',
      ],
    });
    
    this.drive.auth.setCredentials({
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    });
    
    this.logger = logger;
  }

  /**
   * Валидация параметров для Drive операций
   */
  validateDriveRequest(data) {
    const { action, fileId, fileName, folderId, filePath } = data;
    
    if (!action) {
      throw new Error('Действие обязательно');
    }
    
    const validActions = [
      'upload', 'download', 'delete', 'copy', 'move', 
      'list', 'createFolder', 'share', 'unshare', 
      'getInfo', 'search', 'export'
    ];
    
    if (!validActions.includes(action)) {
      throw new Error(`Недопустимое действие. Поддерживаемые: ${validActions.join(', ')}`);
    }
    
    if (action === 'upload' && !filePath) {
      throw new Error('Путь к файлу обязателен для загрузки');
    }
    
    if (['download', 'delete', 'copy', 'move', 'getInfo', 'export'].includes(action) && !fileId) {
      throw new Error('ID файла обязательно для этого действия');
    }
    
    if (action === 'createFolder' && !folderId) {
      throw new Error('ID родительской папки обязателен для создания папки');
    }
    
    if (action === 'share' && !data.email) {
      throw new Error('Email пользователя обязателен для предоставления доступа');
    }
    
    return true;
  }

  /**
   * Загрузка файла в Google Drive
   */
  async uploadFile(filePath, options = {}) {
    try {
      this.logger.info('Начало загрузки файла', { filePath });
      
      const {
        folderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID,
        fileName = path.basename(filePath),
        mimeType = mime.getType(filePath),
        description = '',
        parents = [folderId],
      } = options;

      // Проверяем, существует ли файл локально
      try {
        await fs.access(filePath);
      } catch (error) {
        throw new Error(`Файл не найден: ${filePath}`);
      }

      const fileMetadata = {
        name: fileName,
        parents: parents,
        description: description,
      };

      const media = {
        mimeType: mimeType,
        body: require('fs').createReadStream(filePath),
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name, size, createdTime, modifiedTime, webViewLink',
      });

      const file = response.data;

      this.logger.info('Файл успешно загружен', {
        fileId: file.id,
        fileName: file.name,
        size: file.size,
      });

      return {
        id: file.id,
        name: file.name,
        size: file.size,
        webViewLink: file.webViewLink,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
      };
    } catch (error) {
      this.logger.error('Ошибка загрузки файла', { filePath, error });
      throw new Error(`Ошибка загрузки файла: ${error.message}`);
    }
  }

  /**
   * Загрузка множества файлов
   */
  async uploadMultipleFiles(files, options = {}) {
    try {
      this.logger.info('Начало загрузки множества файлов', { count: files.length });
      
      const results = [];
      
      for (const file of files) {
        try {
          const result = await this.uploadFile(file.path, file.options);
          results.push({
            originalName: file.path,
            ...result,
            success: true,
          });
        } catch (error) {
          this.logger.error('Ошибка загрузки файла', { file: file.path, error });
          results.push({
            originalName: file.path,
            error: error.message,
            success: false,
          });
        }
      }

      this.logger.info('Загрузка множества файлов завершена', {
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      });

      return results;
    } catch (error) {
      this.logger.error('Ошибка загрузки множества файлов', error);
      throw error;
    }
  }

  /**
   * Скачивание файла из Google Drive
   */
  async downloadFile(fileId, outputPath, options = {}) {
    try {
      this.logger.info('Начало скачивания файла', { fileId, outputPath });
      
      const {
        mimeType = 'application/octet-stream',
      } = options;

      const response = await this.drive.files.get({
        fileId: fileId,
        alt: 'media',
      }, {
        responseType: 'stream',
      });

      await new Promise((resolve, reject) => {
        const writeStream = require('fs').createWriteStream(outputPath);
        
        response.data
          .on('end', () => {
            this.logger.info('Файл успешно скачан', { fileId, outputPath });
            resolve();
          })
          .on('error', (error) => {
            this.logger.error('Ошибка скачивания файла', error);
            reject(error);
          })
          .pipe(writeStream);
      });

      // Получаем информацию о файле
      const fileInfo = await this.getFileInfo(fileId);

      return {
        fileId,
        fileName: fileInfo.name,
        outputPath,
        size: fileInfo.size,
      };
    } catch (error) {
      this.logger.error('Ошибка скачивания файла', { fileId, error });
      throw new Error(`Ошибка скачивания файла: ${error.message}`);
    }
  }

  /**
   * Скачивание нескольких файлов
   */
  async downloadMultipleFiles(fileIds, outputDir, options = {}) {
    try {
      this.logger.info('Начало скачивания множества файлов', { count: fileIds.length });
      
      await fs.mkdir(outputDir, { recursive: true });
      
      const results = [];
      
      for (const fileId of fileIds) {
        try {
          const fileInfo = await this.getFileInfo(fileId);
          const outputPath = path.join(outputDir, fileInfo.name);
          
          const result = await this.downloadFile(fileId, outputPath, options);
          results.push({
            ...result,
            originalName: fileInfo.name,
            success: true,
          });
        } catch (error) {
          this.logger.error('Ошибка скачивания файла', { fileId, error });
          results.push({
            fileId,
            error: error.message,
            success: false,
          });
        }
      }

      this.logger.info('Скачивание множества файлов завершено', {
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      });

      return results;
    } catch (error) {
      this.logger.error('Ошибка скачивания множества файлов', error);
      throw error;
    }
  }

  /**
   * Удаление файла из Google Drive
   */
  async deleteFile(fileId, permanent = false) {
    try {
      this.logger.info('Начало удаления файла', { fileId, permanent });
      
      if (permanent) {
        await this.drive.files.delete({
          fileId: fileId,
        });
      } else {
        // Перемещение в корзину
        await this.drive.files.update({
          fileId: fileId,
          requestBody: {
            trashed: true,
          },
        });
      }

      this.logger.info('Файл успешно удален', { fileId, permanent });

      return {
        fileId,
        deleted: true,
        permanent,
      };
    } catch (error) {
      this.logger.error('Ошибка удаления файла', { fileId, error });
      throw new Error(`Ошибка удаления файла: ${error.message}`);
    }
  }

  /**
   * Создание папки в Google Drive
   */
  async createFolder(folderName, parentId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID) {
    try {
      this.logger.info('Создание папки', { folderName, parentId });
      
      const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        fields: 'id, name, webViewLink, createdTime',
      });

      const folder = response.data;

      this.logger.info('Папка успешно создана', {
        folderId: folder.id,
        folderName: folder.name,
      });

      return {
        id: folder.id,
        name: folder.name,
        webViewLink: folder.webViewLink,
        createdTime: folder.createdTime,
      };
    } catch (error) {
      this.logger.error('Ошибка создания папки', { folderName, error });
      throw new Error(`Ошибка создания папки: ${error.message}`);
    }
  }

  /**
   * Получение списка файлов в папке
   */
  async listFiles(folderId, options = {}) {
    try {
      this.logger.info('Получение списка файлов', { folderId });
      
      const {
        pageSize = 10,
        pageToken,
        orderBy = 'modifiedTime desc',
        fields = 'files(id, name, size, mimeType, createdTime, modifiedTime, webViewLink, owners, permissions)',
        includeItemsFromAllDrives = false,
        supportsAllDrives = false,
      } = options;

      const query = `'${folderId}' in parents and trashed=false`;

      const response = await this.drive.files.list({
        q: query,
        pageSize,
        pageToken,
        orderBy,
        fields,
        includeItemsFromAllDrives,
        supportsAllDrives,
      });

      const files = response.data.files || [];

      this.logger.info('Список файлов получен', {
        count: files.length,
        hasMore: !!response.data.nextPageToken,
      });

      return {
        files,
        nextPageToken: response.data.nextPageToken,
      };
    } catch (error) {
      this.logger.error('Ошибка получения списка файлов', { folderId, error });
      throw new Error(`Ошибка получения списка файлов: ${error.message}`);
    }
  }

  /**
   * Поиск файлов
   */
  async searchFiles(query, options = {}) {
    try {
      this.logger.info('Поиск файлов', { query });
      
      const {
        folderId,
        mimeType,
        owner,
        createdTime,
        modifiedTime,
        pageSize = 10,
        orderBy = 'modifiedTime desc',
        fields = 'files(id, name, size, mimeType, createdTime, modifiedTime, webViewLink)',
      } = options;

      let searchQuery = `name contains '${query}' and trashed=false`;

      if (folderId) {
        searchQuery += ` and '${folderId}' in parents`;
      }

      if (mimeType) {
        searchQuery += ` and mimeType='${mimeType}'`;
      }

      if (owner) {
        searchQuery += ` and '${owner}' in owners`;
      }

      if (createdTime) {
        searchQuery += ` and createdTime >= '${createdTime}'`;
      }

      if (modifiedTime) {
        searchQuery += ` and modifiedTime >= '${modifiedTime}'`;
      }

      const response = await this.drive.files.list({
        q: searchQuery,
        pageSize,
        orderBy,
        fields,
      });

      const files = response.data.files || [];

      this.logger.info('Поиск завершен', {
        query,
        count: files.length,
      });

      return {
        files,
        query,
      };
    } catch (error) {
      this.logger.error('Ошибка поиска файлов', { query, error });
      throw new Error(`Ошибка поиска файлов: ${error.message}`);
    }
  }

  /**
   * Получение информации о файле
   */
  async getFileInfo(fileId, fields = 'id, name, size, mimeType, createdTime, modifiedTime, webViewLink, owners, permissions, trashed') {
    try {
      this.logger.info('Получение информации о файле', { fileId });
      
      const response = await this.drive.files.get({
        fileId,
        fields,
      });

      this.logger.info('Информация о файле получена', {
        fileId,
        fileName: response.data.name,
      });

      return response.data;
    } catch (error) {
      this.logger.error('Ошибка получения информации о файле', { fileId, error });
      throw new Error(`Ошибка получения информации о файле: ${error.message}`);
    }
  }

  /**
   * Копирование файла
   */
  async copyFile(fileId, destinationFolderId, newName) {
    try {
      this.logger.info('Копирование файла', { fileId, destinationFolderId });
      
      const fileMetadata = {};
      
      if (newName) {
        fileMetadata.name = newName;
      }
      
      if (destinationFolderId) {
        fileMetadata.parents = [destinationFolderId];
      }

      const response = await this.drive.files.copy({
        fileId,
        requestBody: fileMetadata,
        fields: 'id, name, size, createdTime, webViewLink',
      });

      const copiedFile = response.data;

      this.logger.info('Файл успешно скопирован', {
        originalFileId: fileId,
        copiedFileId: copiedFile.id,
        fileName: copiedFile.name,
      });

      return copiedFile;
    } catch (error) {
      this.logger.error('Ошибка копирования файла', { fileId, error });
      throw new Error(`Ошибка копирования файла: ${error.message}`);
    }
  }

  /**
   * Перемещение файла
   */
  async moveFile(fileId, destinationFolderId) {
    try {
      this.logger.info('Перемещение файла', { fileId, destinationFolderId });
      
      // Получаем текущих родителей файла
      const fileInfo = await this.getFileInfo(fileId, 'parents');
      const previousParents = fileInfo.parents.map(parent => parent.id).join(',');

      const response = await this.drive.files.update({
        fileId,
        addParents: destinationFolderId,
        removeParents: previousParents,
        fields: 'id, name, parents, webViewLink',
      });

      const movedFile = response.data;

      this.logger.info('Файл успешно перемещен', {
        fileId: movedFile.id,
        fileName: movedFile.name,
        newParents: movedFile.parents,
      });

      return movedFile;
    } catch (error) {
      this.logger.error('Ошибка перемещения файла', { fileId, error });
      throw new Error(`Ошибка перемещения файла: ${error.message}`);
    }
  }

  /**
   * Предоставление доступа к файлу
   */
  async shareFile(fileId, email, role = 'reader', options = {}) {
    try {
      this.logger.info('Предоставление доступа к файлу', { fileId, email, role });
      
      const {
        sendNotificationEmail = true,
        emailMessage,
        type = 'user',
        domain,
        allowFileDiscovery = false,
      } = options;

      const permission = {
        type,
        role,
        emailAddress: email,
      };

      if (type === 'domain' && domain) {
        permission.domain = domain;
        permission.allowFileDiscovery = allowFileDiscovery;
      }

      const response = await this.drive.permissions.create({
        fileId,
        requestBody: permission,
        sendNotificationEmail,
        emailMessage,
        fields: 'id, type, role, emailAddress, domain',
      });

      const permissionInfo = response.data;

      this.logger.info('Доступ предоставлен', {
        fileId,
        email,
        role: permissionInfo.role,
      });

      return permissionInfo;
    } catch (error) {
      this.logger.error('Ошибка предоставления доступа', { fileId, email, error });
      throw new Error(`Ошибка предоставления доступа: ${error.message}`);
    }
  }

  /**
   * Отзыв доступа к файлу
   */
  async unshareFile(fileId, email, permissionId) {
    try {
      this.logger.info('Отзыв доступа к файлу', { fileId, email });
      
      let targetPermissionId = permissionId;
      
      if (!targetPermissionId) {
        // Получаем список разрешений для поиска по email
        const fileInfo = await this.getFileInfo(fileId, 'permissions');
        const permission = fileInfo.permissions.find(p => p.emailAddress === email);
        
        if (!permission) {
          throw new Error(`Разрешение для ${email} не найдено`);
        }
        
        targetPermissionId = permission.id;
      }

      await this.drive.permissions.delete({
        fileId,
        permissionId: targetPermissionId,
      });

      this.logger.info('Доступ отозван', { fileId, email });

      return {
        fileId,
        email,
        revoked: true,
      };
    } catch (error) {
      this.logger.error('Ошибка отзыва доступа', { fileId, email, error });
      throw new Error(`Ошибка отзыва доступа: ${error.message}`);
    }
  }

  /**
   * Экспорт Google Docs файлов в другие форматы
   */
  async exportFile(fileId, mimeType) {
    try {
      this.logger.info('Экспорт файла', { fileId, mimeType });
      
      const response = await this.drive.files.export({
        fileId,
        mimeType,
      }, {
        responseType: 'stream',
      });

      const chunks = [];
      for await (const chunk of response.data) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);

      this.logger.info('Файл успешно экспортирован', { fileId, mimeType });

      return {
        buffer,
        mimeType,
      };
    } catch (error) {
      this.logger.error('Ошибка экспорта файла', { fileId, error });
      throw new Error(`Ошибка экспорта файла: ${error.message}`);
    }
  }

  /**
   * Создание резервной копии папки
   */
  async createFolderBackup(folderId, backupName, destinationFolderId) {
    try {
      this.logger.info('Создание резервной копии папки', { folderId, backupName });
      
      // Получаем список всех файлов в папке
      const { files } = await this.listFiles(folderId, { pageSize: 1000 });
      
      if (files.length === 0) {
        throw new Error('Папка пуста');
      }

      // Создаем папку для резервной копии
      const backupFolder = await this.createFolder(backupName, destinationFolderId);
      
      const backupResults = [];
      
      for (const file of files) {
        try {
          // Скачиваем и загружаем файл в папку резервной копии
          const tempPath = path.join('/tmp', `temp_${file.id}_${file.name}`);
          
          await this.downloadFile(file.id, tempPath);
          const uploadedFile = await this.uploadFile(tempPath, {
            folderId: backupFolder.id,
            fileName: file.name,
          });
          
          // Удаляем временный файл
          await fs.unlink(tempPath).catch(() => {});
          
          backupResults.push({
            originalFile: file,
            backupFile: uploadedFile,
            success: true,
          });
        } catch (error) {
          this.logger.error('Ошибка резервного копирования файла', { fileId: file.id, error });
          backupResults.push({
            originalFile: file,
            error: error.message,
            success: false,
          });
        }
      }

      this.logger.info('Резервное копирование завершено', {
        folderId,
        backupFolderId: backupFolder.id,
        total: files.length,
        successful: backupResults.filter(r => r.success).length,
      });

      return {
        backupFolder,
        results: backupResults,
        summary: {
          total: files.length,
          successful: backupResults.filter(r => r.success).length,
          failed: backupResults.filter(r => !r.success).length,
        },
      };
    } catch (error) {
      this.logger.error('Ошибка создания резервной копии', { folderId, error });
      throw error;
    }
  }

  /**
   * Синхронизация файлов с локальной папкой
   */
  async syncFiles(localDir, driveFolderId) {
    try {
      this.logger.info('Синхронизация файлов начата', { localDir, driveFolderId });
      
      // Получаем список файлов в Google Drive
      const { files: driveFiles } = await this.listFiles(driveFolderId, { pageSize: 1000 });
      
      // Читаем список файлов в локальной папке
      const localFiles = await fs.readdir(localDir);
      
      const syncResults = {
        uploaded: [],
        updated: [],
        unchanged: [],
        errors: [],
      };

      // Загружаем новые или обновленные файлы
      for (const localFile of localFiles) {
        try {
          const localPath = path.join(localDir, localFile);
          const localStat = await fs.stat(localPath);
          
          if (!localStat.isFile()) continue;
          
          const existingFile = driveFiles.find(df => df.name === localFile);
          
          if (!existingFile) {
            // Новый файл
            const uploadedFile = await this.uploadFile(localPath, {
              folderId: driveFolderId,
              fileName: localFile,
            });
            syncResults.uploaded.push({
              fileName: localFile,
              driveId: uploadedFile.id,
            });
          } else {
            // Проверяем изменения
            if (existingFile.modifiedTime) {
              const driveModified = new Date(existingFile.modifiedTime).getTime();
              const localModified = new Date(localStat.mtime).getTime();
              
              if (localModified > driveModified) {
                // Обновленный файл - перезагружаем
                const uploadedFile = await this.uploadFile(localPath, {
                  folderId: driveFolderId,
                  fileName: localFile,
                });
                syncResults.updated.push({
                  fileName: localFile,
                  driveId: uploadedFile.id,
                });
              } else {
                syncResults.unchanged.push({
                  fileName: localFile,
                });
              }
            }
          }
        } catch (error) {
          this.logger.error('Ошибка синхронизации файла', { fileName: localFile, error });
          syncResults.errors.push({
            fileName: localFile,
            error: error.message,
          });
        }
      }

      this.logger.info('Синхронизация завершена', syncResults);

      return syncResults;
    } catch (error) {
      this.logger.error('Ошибка синхронизации', error);
      throw error;
    }
  }
}

module.exports = new DriveService();