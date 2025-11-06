const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;
const mime = require('mime');
const { createWorker } = require('tesseract.js');
const { GoogleSpeechToText } = require('@google-cloud/speech');
const { GoogleTextToSpeech } = require('@google-cloud/text-to-speech');
const logger = require('../utils/logger');

class MediaService {
  constructor() {
    this.logger = logger;
    this.speechClient = new GoogleSpeechToText();
    this.ttsClient = new GoogleTextToSpeech();
  }

  /**
   * Валидация медиа файлов
   */
  validateMediaFile(file, type) {
    const { mimetype, size, originalname } = file;
    
    if (!mimetype) {
      throw new Error('Тип файла обязателен');
    }
    
    if (!originalname) {
      throw new Error('Имя файла обязательно');
    }
    
    switch (type) {
      case 'image':
        if (!mimetype.startsWith('image/')) {
          throw new Error('Файл должен быть изображением');
        }
        if (size > 10 * 1024 * 1024) { // 10MB
          throw new Error('Размер изображения не должен превышать 10MB');
        }
        break;
      case 'video':
        if (!mimetype.startsWith('video/')) {
          throw new Error('Файл должен быть видео');
        }
        if (size > 500 * 1024 * 1024) { // 500MB
          throw new Error('Размер видео не должен превышать 500MB');
        }
        break;
      case 'audio':
        if (!mimetype.startsWith('audio/')) {
          throw new Error('Файл должен быть аудио');
        }
        if (size > 100 * 1024 * 1024) { // 100MB
          throw new Error('Размер аудио не должен превышать 100MB');
        }
        break;
      default:
        throw new Error('Неподдерживаемый тип медиа');
    }
    
    return true;
  }

  /**
   * Обработка изображения - изменение размера, формат, качество
   */
  async processImage(inputPath, outputPath, options = {}) {
    try {
      this.logger.info('Начало обработки изображения', { inputPath, options });
      
      const {
        width,
        height,
        format = 'jpeg',
        quality = 80,
        fit = 'cover',
        position = 'center',
        blur = false,
        sharpen = false,
        brightness = 1,
        saturation = 1,
      } = options;

      let image = sharp(inputPath);
      
      // Изменение размера
      if (width || height) {
        image = image.resize(width, height, {
          fit,
          position,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        });
      }
      
      // Применение фильтров
      if (blur) {
        image = image.blur();
      }
      
      if (sharpen) {
        image = image.sharpen();
      }
      
      // Корректировка яркости и насыщенности
      if (brightness !== 1 || saturation !== 1) {
        image = image.modulate({
          brightness,
          saturation,
          lightness: 1
        });
      }
      
      // Настройка качества и формата
      const formatOptions = {};
      if (format === 'jpeg' || format === 'jpg') {
        formatOptions.quality = quality;
        formatOptions.progressive = true;
        formatOptions.chromaSubsampling = '4:4:4';
      } else if (format === 'png') {
        formatOptions.quality = Math.floor((100 - quality) * 0.7);
        formatOptions.compressionLevel = Math.floor((100 - quality) / 10);
      } else if (format === 'webp') {
        formatOptions.quality = quality;
      } else if (format === 'avif') {
        formatOptions.quality = quality;
      }

      const buffer = await image[format](formatOptions).toBuffer();
      await fs.writeFile(outputPath, buffer);
      
      const metadata = await sharp(outputPath).metadata();
      
      this.logger.info('Изображение успешно обработано', {
        inputPath,
        outputPath,
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size,
      });

      return {
        path: outputPath,
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size,
        buffer,
      };
    } catch (error) {
      this.logger.error('Ошибка обработки изображения', { inputPath, error });
      throw new Error(`Ошибка обработки изображения: ${error.message}`);
    }
  }

  /**
   * Создание миниатюры изображения
   */
  async createThumbnail(inputPath, outputPath, size = 200) {
    try {
      this.logger.info('Создание миниатюры', { inputPath, size });
      
      const thumbnailPath = outputPath || path.join(
        path.dirname(inputPath),
        `thumb_${path.basename(inputPath, path.extname(inputPath))}.jpg`
      );

      await this.processImage(inputPath, thumbnailPath, {
        width: size,
        height: size,
        format: 'jpeg',
        quality: 70,
        fit: 'cover',
      });

      this.logger.info('Миниатюра создана успешно', { thumbnailPath });

      return {
        path: thumbnailPath,
        size,
      };
    } catch (error) {
      this.logger.error('Ошибка создания миниатюры', error);
      throw new Error(`Ошибка создания миниатюры: ${error.message}`);
    }
  }

  /**
   * Обработка видео - изменение разрешения, сжатие, извлечение кадров
   */
  async processVideo(inputPath, outputPath, options = {}) {
    try {
      this.logger.info('Начало обработки видео', { inputPath, options });
      
      const {
        width,
        height,
        bitrate = '1000k',
        framerate = 30,
        codec = 'libx264',
        audioBitrate = '128k',
        audioCodec = 'aac',
        format = 'mp4',
      } = options;

      return new Promise((resolve, reject) => {
        let command = ffmpeg(inputPath);

        // Изменение разрешения
        if (width || height) {
          const resolution = width && height ? `${width}x${height}` : (width || height);
          command = command.size(resolution);
        }

        // Настройки видео
        command = command
          .videoCodec(codec)
          .videoBitrate(bitrate)
          .fps(framerate)
          .outputOptions('-preset', 'medium')
          .outputOptions('-crf', '23');

        // Настройки аудио
        command = command
          .audioCodec(audioCodec)
          .audioBitrate(audioBitrate)
          .audioChannels(2);

        // Формат вывода
        if (format === 'mp4') {
          command = command.outputOptions('-movflags', '+faststart');
        }

        command
          .on('start', (commandLine) => {
            this.logger.info('FFmpeg команда запущена', { commandLine });
          })
          .on('progress', (progress) => {
            this.logger.info('Прогресс обработки видео', progress);
          })
          .on('end', async () => {
            this.logger.info('Видео успешно обработано', { outputPath });
            
            // Получение метаданных
            const metadata = await this.getVideoMetadata(outputPath);
            resolve({
              path: outputPath,
              metadata,
            });
          })
          .on('error', (error) => {
            this.logger.error('Ошибка обработки видео', error);
            reject(new Error(`Ошибка обработки видео: ${error.message}`));
          })
          .save(outputPath);
      });
    } catch (error) {
      this.logger.error('Ошибка обработки видео', error);
      throw error;
    }
  }

  /**
   * Извлечение кадров из видео
   */
  async extractFrames(inputPath, outputDir, options = {}) {
    try {
      this.logger.info('Извлечение кадров из видео', { inputPath, outputDir });
      
      const {
        fps = 1, // 1 кадр в секунду
        format = 'jpg',
        quality = 90,
      } = options;

      await fs.mkdir(outputDir, { recursive: true });

      const outputPattern = path.join(outputDir, 'frame_%04d.' + format);

      return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .outputOptions([
            `-vf fps=${fps}`,
            `-q:v ${100 - quality}`, // Инвертированная шкала качества для ffmpeg
          ])
          .output(outputPattern)
          .on('end', async () => {
            // Подсчет извлеченных кадров
            const files = await fs.readdir(outputDir);
            const frameFiles = files.filter(file => file.startsWith('frame_'));
            
            this.logger.info('Кадры извлечены успешно', {
              count: frameFiles.length,
              outputDir,
            });
            
            resolve({
              frames: frameFiles.map(file => path.join(outputDir, file)),
              count: frameFiles.length,
            });
          })
          .on('error', (error) => {
            this.logger.error('Ошибка извлечения кадров', error);
            reject(new Error(`Ошибка извлечения кадров: ${error.message}`));
          })
          .run();
      });
    } catch (error) {
      this.logger.error('Ошибка извлечения кадров', error);
      throw error;
    }
  }

  /**
   * Обработка аудио - конвертация, изменение качества
   */
  async processAudio(inputPath, outputPath, options = {}) {
    try {
      this.logger.info('Начало обработки аудио', { inputPath, options });
      
      const {
        bitrate = '128k',
        sampleRate = 44100,
        channels = 2,
        codec = 'aac',
        format = 'mp3',
        volume = 1, // Громкость (0.1 - 3.0)
      } = options;

      return new Promise((resolve, reject) => {
        let command = ffmpeg(inputPath);

        // Настройки аудио
        command = command
          .audioCodec(codec)
          .audioBitrate(bitrate)
          .audioFrequency(sampleRate)
          .audioChannels(channels);

        // Регулировка громкости
        if (volume !== 1) {
          const volumeDb = 20 * Math.log10(volume);
          command = command.audioFilters(`volume=${volumeDb}dB`);
        }

        // Оптимизация для различных форматов
        if (format === 'mp3') {
          command = command.outputOptions('-b:a', bitrate);
        } else if (format === 'ogg') {
          command = command.outputOptions('-q:a', '4'); // Качество OGG
        }

        command
          .on('start', (commandLine) => {
            this.logger.info('FFmpeg аудио команда запущена', { commandLine });
          })
          .on('progress', (progress) => {
            this.logger.info('Прогресс обработки аудио', progress);
          })
          .on('end', async () => {
            this.logger.info('Аудио успешно обработано', { outputPath });
            
            // Получение метаданных
            const metadata = await this.getAudioMetadata(outputPath);
            resolve({
              path: outputPath,
              metadata,
            });
          })
          .on('error', (error) => {
            this.logger.error('Ошибка обработки аудио', error);
            reject(new Error(`Ошибка обработки аудио: ${error.message}`));
          })
          .save(outputPath);
      });
    } catch (error) {
      this.logger.error('Ошибка обработки аудио', error);
      throw error;
    }
  }

  /**
   * Распознавание текста из изображения (OCR)
   */
  async extractTextFromImage(imagePath, options = {}) {
    try {
      this.logger.info('Начало OCR обработки', { imagePath });
      
      const {
        language = 'eng',
        oem = 1, // Engine mode: 0-3
        psm = 3, // Page segmentation mode: 0-13
        whitelist, // Разрешенные символы
        blacklist, // Запрещенные символы
      } = options;

      const worker = await createWorker(language, oem, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            this.logger.info('OCR прогресс', { progress: m.progress });
          }
        }
      });

      // Настройки Tesseract
      if (psm) {
        await worker.setParameters('psm', psm);
      }
      
      if (whitelist) {
        await worker.setParameters('tessedit_char_whitelist', whitelist);
      }
      
      if (blacklist) {
        await worker.setParameters('tessedit_char_blacklist', blacklist);
      }

      const { data: { text, confidence } } = await worker.recognize(imagePath);
      await worker.terminate();

      this.logger.info('OCR завершен успешно', {
        confidence,
        textLength: text.length,
      });

      return {
        text: text.trim(),
        confidence,
        language,
      };
    } catch (error) {
      this.logger.error('Ошибка OCR', error);
      throw new Error(`Ошибка распознавания текста: ${error.message}`);
    }
  }

  /**
   * Речь в текст (Speech-to-Text)
   */
  async speechToText(audioPath, options = {}) {
    try {
      this.logger.info('Начало Speech-to-Text', { audioPath });
      
      const {
        languageCode = 'ru-RU',
        sampleRateHertz,
        encoding = 'MP3',
        enableAutomaticPunctuation = true,
        enableWordTimeOffsets = false,
        enableSpeakerDiarization = false,
        model = 'latest_long',
      } = options;

      const request = {
        audio: {
          content: await fs.readFile(audioPath),
        },
        config: {
          encoding,
          languageCode,
          enableAutomaticPunctuation,
          enableWordTimeOffsets,
          enableSpeakerDiarization,
          model,
        },
      };

      if (sampleRateHertz) {
        request.config.sampleRateHertz = sampleRateHertz;
      }

      const [response] = await this.speechClient.recognize(request);
      const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join('\n');

      this.logger.info('Speech-to-Text завершено успешно', {
        transcriptionLength: transcription.length,
      });

      return {
        transcription: transcription.trim(),
        alternatives: response.results.map(result => ({
          transcript: result.alternatives[0].transcript,
          confidence: result.alternatives[0].confidence,
        })),
        languageCode,
      };
    } catch (error) {
      this.logger.error('Ошибка Speech-to-Text', error);
      throw new Error(`Ошибка распознавания речи: ${error.message}`);
    }
  }

  /**
   * Текст в речь (Text-to-Speech)
   */
  async textToSpeech(text, outputPath, options = {}) {
    try {
      this.logger.info('Начало Text-to-Speech', { textLength: text.length });
      
      const {
        languageCode = 'ru-RU',
        voice = 'ru-RU-Standard-A',
        audioEncoding = 'MP3',
        speakingRate = 1.0,
        pitch = 0.0,
        volumeGainDb = 0.0,
        ssml,
      } = options;

      const request = {
        input: ssml ? { ssml } : { text },
        voice: {
          languageCode,
          name: voice,
        },
        audioConfig: {
          audioEncoding,
          speakingRate,
          pitch,
          volumeGainDb,
        },
      };

      const [response] = await this.ttsClient.synthesizeSpeech(request);
      await fs.writeFile(outputPath, response.audioContent);

      this.logger.info('Text-to-Speech завершено успешно', {
        outputPath,
        voice,
        languageCode,
      });

      return {
        path: outputPath,
        voice,
        languageCode,
      };
    } catch (error) {
      this.logger.error('Ошибка Text-to-Speech', error);
      throw new Error(`Ошибка синтеза речи: ${error.message}`);
    }
  }

  /**
   * Получение метаданных видео
   */
  async getVideoMetadata(videoPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (error, metadata) => {
        if (error) {
          this.logger.error('Ошибка получения метаданных видео', error);
          reject(error);
          return;
        }

        const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
        const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');

        const result = {
          duration: metadata.format.duration,
          size: metadata.format.size,
          bitrate: metadata.format.bit_rate,
          format: metadata.format.format_name,
          video: videoStream ? {
            codec: videoStream.codec_name,
            width: videoStream.width,
            height: videoStream.height,
            fps: eval(videoStream.r_frame_rate),
            bitrate: videoStream.bit_rate,
          } : null,
          audio: audioStream ? {
            codec: audioStream.codec_name,
            sampleRate: audioStream.sample_rate,
            channels: audioStream.channels,
            bitrate: audioStream.bit_rate,
          } : null,
        };

        resolve(result);
      });
    });
  }

  /**
   * Получение метаданных аудио
   */
  async getAudioMetadata(audioPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(audioPath, (error, metadata) => {
        if (error) {
          this.logger.error('Ошибка получения метаданных аудио', error);
          reject(error);
          return;
        }

        const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');

        const result = {
          duration: metadata.format.duration,
          size: metadata.format.size,
          bitrate: metadata.format.bit_rate,
          format: metadata.format.format_name,
          audio: audioStream ? {
            codec: audioStream.codec_name,
            sampleRate: audioStream.sample_rate,
            channels: audioStream.channels,
            bitrate: audioStream.bit_rate,
          } : null,
        };

        resolve(result);
      });
    });
  }

  /**
   * Создание превью медиа файлов
   */
  async createMediaPreview(filePath, outputDir, mediaType) {
    try {
      this.logger.info('Создание превью медиа', { filePath, mediaType });
      
      const previewPath = path.join(
        outputDir,
        `preview_${path.basename(filePath, path.extname(filePath))}`
      );

      switch (mediaType) {
        case 'image':
          return await this.createThumbnail(filePath, previewPath + '.jpg', 300);
        
        case 'video':
          // Извлечение первого кадра видео
          return new Promise((resolve, reject) => {
            ffmpeg(filePath)
              .screenshots({
                timestamps: [0],
                filename: path.basename(previewPath + '.jpg'),
                folder: path.dirname(previewPath + '.jpg'),
                size: '300x?'
              })
              .on('end', () => {
                this.logger.info('Превью видео создано', { path: previewPath + '.jpg' });
                resolve({ path: previewPath + '.jpg' });
              })
              .on('error', (error) => {
                this.logger.error('Ошибка создания превью видео', error);
                reject(error);
              });
          });
        
        case 'audio':
          // Генерация визуализации аудио
          return new Promise((resolve, reject) => {
            const waveformPath = previewPath + '.png';
            ffmpeg(filePath)
              .outputOptions([
                '-filter_complex',
                'aformat=channel_layouts=mono,showwavespic=s=300x100:colors=white',
              ])
              .frames(1)
              .output(waveformPath)
              .on('end', () => {
                this.logger.info('Превью аудио создано', { path: waveformPath });
                resolve({ path: waveformPath });
              })
              .on('error', (error) => {
                this.logger.error('Ошибка создания превью аудио', error);
                reject(error);
              })
              .run();
          });
        
        default:
          throw new Error(`Неподдерживаемый тип медиа: ${mediaType}`);
      }
    } catch (error) {
      this.logger.error('Ошибка создания превью', error);
      throw error;
    }
  }
}

module.exports = new MediaService();
