const nodemailer = require('nodemailer');
const webpush = require('web-push');
const twilio = require('twilio');
const { google } = require('googleapis');
const EventEmitter = require('events');
const logger = require('../utils/logger');

class NotificationService extends EventEmitter {
  constructor() {
    super();
    
    // Инициализация email транспорта
    this.emailTransporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Инициализация Web Push
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        process.env.VAPID_CONTACT_EMAIL || 'mailto:admin@example.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
    }

    // Инициализация SMS (Twilio)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    }

    // Инициализация Firebase Admin для FCM
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      this.fcmAdmin = require('firebase-admin');
      this.fcmAdmin.initializeApp({
        credential: this.fcmAdmin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
      });
    }

    this.logger = logger;
    
    // Хранилище подписок для разных каналов
    this.subscriptions = {
      email: new Map(),
      sms: new Map(),
      push: new Map(),
      fcm: new Map(),
    };

    // Очереди для отложенных уведомлений
    this.delayedNotifications = new Map();
    
    // Шаблоны уведомлений
    this.templates = new Map();
    
    this.initializeDefaultTemplates();
  }

  /**
   * Инициализация стандартных шаблонов
   */
  initializeDefaultTemplates() {
    // Email шаблоны
    this.templates.set('email:welcome', {
      subject: 'Добро пожаловать в {{appName}}!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Добро пожаловать!</h1>
          <p>Привет {{userName}}!</p>
          <p>Мы рады приветствовать вас в {{appName}}.</p>
          <p>Для начала работы просто войдите в свой аккаунт.</p>
          <p>Спасибо, что выбрали нас!</p>
        </div>
      `,
    });

    this.templates.set('email:password_reset', {
      subject: 'Сброс пароля - {{appName}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Сброс пароля</h1>
          <p>Привет {{userName}}!</p>
          <p>Для сброса пароля нажмите на ссылку ниже:</p>
          <p><a href="{{resetLink}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Сбросить пароль</a></p>
          <p>Эта ссылка действительна в течение {{expirationTime}}.</p>
          <p>Если вы не запрашивали сброс пароля, проигнорируйте это письмо.</p>
        </div>
      `,
    });

    // Push уведомления
    this.templates.set('push:general', {
      title: '{{title}}',
      body: '{{message}}',
      icon: '/icons/notification-icon.png',
      badge: '/icons/badge-icon.png',
      data: '{{data}}',
    });

    this.templates.set('push:new_message', {
      title: 'Новое сообщение',
      body: '{{senderName}}: {{messagePreview}}',
      icon: '/icons/message-icon.png',
      data: {
        type: 'new_message',
        conversationId: '{{conversationId}}',
      },
    });

    // SMS шаблоны
    this.templates.set('sms:verification', {
      body: 'Ваш код подтверждения для {{appName}}: {{code}}. Код действителен в течение {{expirationTime}}.',
    });

    this.templates.set('sms:security_alert', {
      body: 'Обнаружен вход в ваш аккаунт {{appName}} с IP {{ipAddress}}. Если это не вы, срочно смените пароль.',
    });
  }

  /**
   * Валидация параметров уведомления
   */
  validateNotification(data) {
    const { type, recipients, template, data: notificationData } = data;

    if (!type || !['email', 'sms', 'push', 'fcm', 'inapp'].includes(type)) {
      throw new Error('Недопустимый тип уведомления');
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      throw new Error('Получатели обязательны');
    }

    if (type === 'email' && recipients.some(email => !this.isValidEmail(email))) {
      throw new Error('Некорректный email адрес');
    }

    if ((type === 'sms' || type === 'fcm') && recipients.some(phone => !this.isValidPhone(phone))) {
      throw new Error('Некорректный номер телефона');
    }

    if (!template) {
      throw new Error('Шаблон обязателен');
    }

    if (notificationData && typeof notificationData !== 'object') {
      throw new Error('Данные уведомления должны быть объектом');
    }

    return true;
  }

  /**
   * Валидация email адреса
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Валидация номера телефона
   */
  isValidPhone(phone) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  }

  /**
   * Рендеринг шаблона
   */
  renderTemplate(templateId, data = {}) {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Шаблон ${templateId} не найден`);
    }

    const rendered = {};
    
    Object.keys(template).forEach(key => {
      rendered[key] = template[key];
      
      // Замена переменных в строке
      if (typeof rendered[key] === 'string') {
        Object.keys(data).forEach(dataKey => {
          const regex = new RegExp(`{{${dataKey}}}`, 'g');
          rendered[key] = rendered[key].replace(regex, data[dataKey]);
        });
      }
      
      // Обработка объектов с переменными
      if (typeof rendered[key] === 'object' && rendered[key] !== null) {
        Object.keys(rendered[key]).forEach(objKey => {
          if (typeof rendered[key][objKey] === 'string') {
            Object.keys(data).forEach(dataKey => {
              const regex = new RegeExp(`{{${dataKey}}}`, 'g');
              rendered[key][objKey] = rendered[key][objKey].replace(regex, data[dataKey]);
            });
          }
        });
      }
    });

    return rendered;
  }

  /**
   * Отправка email уведомления
   */
  async sendEmail(recipients, templateId, data = {}, options = {}) {
    try {
      this.logger.info('Отправка email уведомления', { 
        recipients: recipients.length, 
        templateId,
        ...options 
      });

      const rendered = this.renderTemplate(templateId, data);
      
      const mailOptions = {
        from: options.from || process.env.FROM_EMAIL || 'noreply@example.com',
        to: recipients.join(', '),
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text || this.htmlToText(rendered.html),
        ...options,
      };

      // Отправка по отдельности для каждого получателя
      const results = [];
      
      for (const recipient of recipients) {
        try {
          const individualOptions = {
            ...mailOptions,
            to: recipient,
          };
          
          const info = await this.emailTransporter.sendMail(individualOptions);
          results.push({
            recipient,
            messageId: info.messageId,
            success: true,
          });
          
          this.logger.info('Email отправлен', { 
            recipient, 
            messageId: info.messageId 
          });
        } catch (error) {
          this.logger.error('Ошибка отправки email', { recipient, error });
          results.push({
            recipient,
            error: error.message,
            success: false,
          });
        }
      }

      // Событие отправки
      this.emit('notification:sent', {
        type: 'email',
        templateId,
        results,
      });

      return results;
    } catch (error) {
      this.logger.error('Ошибка отправки email уведомления', error);
      throw error;
    }
  }

  /**
   * Отправка SMS уведомления
   */
  async sendSMS(recipients, templateId, data = {}, options = {}) {
    try {
      this.logger.info('Отправка SMS уведомления', { 
        recipients: recipients.length, 
        templateId 
      });

      if (!this.twilioClient) {
        throw new Error('Twilio клиент не инициализирован');
      }

      const rendered = this.renderTemplate(templateId, data);
      
      const results = [];
      
      for (const recipient of recipients) {
        try {
          const message = await this.twilioClient.messages.create({
            body: rendered.body,
            from: options.from || process.env.TWILIO_PHONE_NUMBER,
            to: recipient,
            ...options,
          });
          
          results.push({
            recipient,
            messageId: message.sid,
            success: true,
          });
          
          this.logger.info('SMS отправлен', { 
            recipient, 
            messageId: message.sid 
          });
        } catch (error) {
          this.logger.error('Ошибка отправки SMS', { recipient, error });
          results.push({
            recipient,
            error: error.message,
            success: false,
          });
        }
      }

      this.emit('notification:sent', {
        type: 'sms',
        templateId,
        results,
      });

      return results;
    } catch (error) {
      this.logger.error('Ошибка отправки SMS уведомления', error);
      throw error;
    }
  }

  /**
   * Отправка push уведомления
   */
  async sendPush(recipients, templateId, data = {}, options = {}) {
    try {
      this.logger.info('Отправка push уведомления', { 
        recipients: recipients.length, 
        templateId 
      });

      const rendered = this.renderTemplate(templateId, data);
      const payload = {
        title: rendered.title,
        body: rendered.body,
        icon: rendered.icon,
        badge: rendered.badge,
        data: {
          ...rendered.data,
          ...data,
        },
        ...options,
      };

      const results = [];
      
      for (const recipient of recipients) {
        try {
          const subscription = this.subscriptions.push.get(recipient);
          if (!subscription) {
            throw new Error(`Push подписка для ${recipient} не найдена`);
          }

          const response = await webpush.sendNotification(subscription, JSON.stringify(payload));
          results.push({
            recipient,
            statusCode: response.statusCode,
            success: true,
          });
          
          this.logger.info('Push уведомление отправлено', { 
            recipient, 
            statusCode: response.statusCode 
          });
        } catch (error) {
          // Удаляем недействительные подписки
          if (error.statusCode === 404 || error.statusCode === 410) {
            this.subscriptions.push.delete(recipient);
          }
          
          this.logger.error('Ошибка отправки push уведомления', { recipient, error });
          results.push({
            recipient,
            error: error.message,
            success: false,
          });
        }
      }

      this.emit('notification:sent', {
        type: 'push',
        templateId,
        results,
      });

      return results;
    } catch (error) {
      this.logger.error('Ошибка отправки push уведомления', error);
      throw error;
    }
  }

  /**
   * Отправка FCM уведомления
   */
  async sendFCM(recipients, templateId, data = {}, options = {}) {
    try {
      this.logger.info('Отправка FCM уведомления', { 
        recipients: recipients.length, 
        templateId 
      });

      if (!this.fcmAdmin) {
        throw new Error('Firebase Admin не инициализирован');
      }

      const rendered = this.renderTemplate(templateId, data);
      
      const notification = {
        title: rendered.title,
        body: rendered.body,
        ...options.notification,
      };

      const message = {
        notification,
        data: {
          ...rendered.data,
          ...data,
        },
        tokens: recipients,
        ...options,
      };

      const response = await this.fcmAdmin.messaging().sendMulticast(message);
      
      const results = [];
      
      response.responses.forEach((response, index) => {
        const recipient = recipients[index];
        
        if (response.success) {
          results.push({
            recipient,
            messageId: response.messageId,
            success: true,
          });
        } else {
          results.push({
            recipient,
            error: response.error.message,
            success: false,
          });
        }
      });

      this.logger.info('FCM уведомления отправлены', {
        successCount: response.successCount,
        failureCount: response.failureCount,
      });

      this.emit('notification:sent', {
        type: 'fcm',
        templateId,
        results,
      });

      return results;
    } catch (error) {
      this.logger.error('Ошибка отправки FCM уведомления', error);
      throw error;
    }
  }

  /**
   * Внутренние уведомления (in-app)
   */
  async sendInApp(recipients, templateId, data = {}, options = {}) {
    try {
      this.logger.info('Отправка внутреннего уведомления', { 
        recipients: recipients.length, 
        templateId 
      });

      const notification = {
        id: this.generateId(),
        templateId,
        data,
        recipients,
        timestamp: new Date(),
        read: false,
        ...options,
      };

      const results = [];
      
      for (const recipient of recipients) {
        try {
          const recipientId = typeof recipient === 'object' ? recipient.userId : recipient;
          
          // Сохраняем уведомление в базу данных (здесь можно добавить сохранение)
          // await this.saveNotification(recipientId, notification);
          
          results.push({
            recipient: recipientId,
            notificationId: notification.id,
            success: true,
          });
          
          this.logger.info('Внутреннее уведомление сохранено', { 
            recipient: recipientId, 
            notificationId: notification.id 
          });
        } catch (error) {
          this.logger.error('Ошибка сохранения внутреннего уведомления', { recipient, error });
          results.push({
            recipient,
            error: error.message,
            success: false,
          });
        }
      }

      this.emit('notification:sent', {
        type: 'inapp',
        templateId,
        results,
      });

      return results;
    } catch (error) {
      this.logger.error('Ошибка отправки внутреннего уведомления', error);
      throw error;
    }
  }

  /**
   * Массовая отправка уведомлений
   */
  async sendBulk(notifications) {
    try {
      this.logger.info('Массовая отправка уведомлений', { count: notifications.length });
      
      const results = [];
      
      for (const notification of notifications) {
        try {
          const result = await this.send(notification);
          results.push({
            ...notification,
            result,
            success: true,
          });
        } catch (error) {
          this.logger.error('Ошибка отправки уведомления в массовой рассылке', { notification, error });
          results.push({
            ...notification,
            error: error.message,
            success: false,
          });
        }
      }

      this.logger.info('Массовая отправка завершена', {
        total: notifications.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      });

      return results;
    } catch (error) {
      this.logger.error('Ошибка массовой отправки уведомлений', error);
      throw error;
    }
  }

  /**
   * Универсальный метод отправки
   */
  async send(data) {
    try {
      this.validateNotification(data);
      
      const { type, recipients, template, data: templateData, options = {} } = data;

      switch (type) {
        case 'email':
          return await this.sendEmail(recipients, template, templateData, options);
        case 'sms':
          return await this.sendSMS(recipients, template, templateData, options);
        case 'push':
          return await this.sendPush(recipients, template, templateData, options);
        case 'fcm':
          return await this.sendFCM(recipients, template, templateData, options);
        case 'inapp':
          return await this.sendInApp(recipients, template, templateData, options);
        default:
          throw new Error(`Неподдерживаемый тип уведомления: ${type}`);
      }
    } catch (error) {
      this.logger.error('Ошибка отправки уведомления', { data, error });
      throw error;
    }
  }

  /**
   * Добавление подписки push
   */
  addPushSubscription(userId, subscription) {
    this.subscriptions.push.set(userId, subscription);
    this.logger.info('Push подписка добавлена', { userId });
  }

  /**
   * Удаление подписки push
   */
  removePushSubscription(userId) {
    this.subscriptions.push.delete(userId);
    this.logger.info('Push подписка удалена', { userId });
  }

  /**
   * Добавление шаблона
   */
  addTemplate(templateId, template) {
    this.templates.set(templateId, template);
    this.logger.info('Шаблон добавлен', { templateId });
  }

  /**
   * Удаление шаблона
   */
  removeTemplate(templateId) {
    const existed = this.templates.delete(templateId);
    if (existed) {
      this.logger.info('Шаблон удален', { templateId });
    }
  }

  /**
   * Отложенная отправка уведомления
   */
  scheduleNotification(notification, delay) {
    const notificationId = this.generateId();
    
    setTimeout(() => {
      this.send(notification).catch(error => {
        this.logger.error('Ошибка отложенного уведомления', { notificationId, error });
      });
    }, delay);

    this.logger.info('Отложенное уведомление запланировано', { 
      notificationId, 
      delay: delay + 'ms' 
    });

    return notificationId;
  }

  /**
   * Генерация уникального ID
   */
  generateId() {
    return require('crypto').randomUUID();
  }

  /**
   * Конвертация HTML в текст
   */
  htmlToText(html) {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Получение статистики уведомлений
   */
  async getNotificationStats(userId, dateRange = {}) {
    try {
      // Здесь можно добавить запросы к базе данных для получения статистики
      // Пока возвращаем заглушку
      return {
        totalSent: 0,
        totalRead: 0,
        byType: {
          email: 0,
          sms: 0,
          push: 0,
          fcm: 0,
          inapp: 0,
        },
        byDate: {},
        ...dateRange,
      };
    } catch (error) {
      this.logger.error('Ошибка получения статистики уведомлений', error);
      throw error;
    }
  }

  /**
   * Отметка уведомления как прочитанного
   */
  markAsRead(notificationId, userId) {
    try {
      this.logger.info('Уведомление отмечено как прочитанное', { notificationId, userId });
      
      // Здесь можно добавить обновление в базе данных
      
      this.emit('notification:read', {
        notificationId,
        userId,
      });

      return true;
    } catch (error) {
      this.logger.error('Ошибка отметки уведомления как прочитанного', error);
      throw error;
    }
  }

  /**
   * Отметка всех уведомлений пользователя как прочитанных
   */
  markAllAsRead(userId) {
    try {
      this.logger.info('Все уведомления отмечены как прочитанные', { userId });
      
      // Здесь можно добавить массовое обновление в базе данных
      
      this.emit('notification:allRead', {
        userId,
      });

      return true;
    } catch (error) {
      this.logger.error('Ошибка отметки всех уведомлений как прочитанных', error);
      throw error;
    }
  }

  /**
   * Получение уведомлений пользователя
   */
  async getUserNotifications(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        unreadOnly = false,
        type = null,
      } = options;

      // Здесь можно добавить запрос к базе данных
      // Пока возвращаем заглушку
      
      return {
        notifications: [],
        total: 0,
        unread: 0,
        page,
        limit,
        hasMore: false,
      };
    } catch (error) {
      this.logger.error('Ошибка получения уведомлений пользователя', { userId, error });
      throw error;
    }
  }

  /**
   * Отписка от уведомлений
   */
  unsubscribe(userId, notificationType = 'all') {
    try {
      this.logger.info('Отписка от уведомлений', { userId, notificationType });
      
      if (notificationType === 'all') {
        // Удаление всех подписок пользователя
        this.subscriptions.email.delete(userId);
        this.subscriptions.sms.delete(userId);
        this.subscriptions.push.delete(userId);
        this.subscriptions.fcm.delete(userId);
      } else if (this.subscriptions[notificationType]) {
        this.subscriptions[notificationType].delete(userId);
      }

      this.emit('notification:unsubscribed', {
        userId,
        notificationType,
      });

      return true;
    } catch (error) {
      this.logger.error('Ошибка отписки от уведомлений', { userId, notificationType, error });
      throw error;
    }
  }
}

module.exports = new NotificationService();
