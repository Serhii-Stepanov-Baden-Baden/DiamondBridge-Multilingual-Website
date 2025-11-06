const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    this.googleAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    
    this.logger = logger;
  }

  /**
   * Валидация входных данных для AI операций
   */
  validateAIRequest(data) {
    const { prompt, provider, type, maxTokens, temperature } = data;
    
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt обязателен и должен быть строкой');
    }
    
    if (!provider || !['openai', 'anthropic', 'google'].includes(provider)) {
      throw new Error('Провайдер должен быть: openai, anthropic или google');
    }
    
    if (type && !['text', 'chat', 'completion', 'embedding'].includes(type)) {
      throw new Error('Тип должен быть: text, chat, completion или embedding');
    }
    
    if (maxTokens && (maxTokens < 1 || maxTokens > 32768)) {
      throw new Error('maxTokens должен быть между 1 и 32768');
    }
    
    if (temperature && (temperature < 0 || temperature > 2)) {
      throw new Error('temperature должен быть между 0 и 2');
    }
    
    return true;
  }

  /**
   * Генерация текста через OpenAI
   */
  async generateWithOpenAI(prompt, options = {}) {
    try {
      this.logger.info('OpenAI генерация начата', { prompt: prompt.substring(0, 100) });
      
      const {
        model = 'gpt-4',
        maxTokens = 1000,
        temperature = 0.7,
        messages = [],
      } = options;

      const completion = await this.openai.chat.completions.create({
        model,
        messages: [...messages, { role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature,
      });

      const result = {
        provider: 'openai',
        content: completion.choices[0].message.content,
        usage: completion.usage,
        model: completion.model,
      };

      this.logger.info('OpenAI генерация завершена успешно', { 
        model: completion.model,
        tokens: completion.usage.total_tokens 
      });

      return result;
    } catch (error) {
      this.logger.error('Ошибка OpenAI', error);
      throw new Error(`OpenAI ошибка: ${error.message}`);
    }
  }

  /**
   * Генерация текста через Anthropic
   */
  async generateWithAnthropic(prompt, options = {}) {
    try {
      this.logger.info('Anthropic генерация начата', { prompt: prompt.substring(0, 100) });
      
      const {
        model = 'claude-3-sonnet-20240229',
        maxTokens = 1000,
        temperature = 0.7,
        system = '',
      } = options;

      const message = await this.anthropic.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        system,
        messages: [{ role: 'user', content: prompt }],
      });

      const result = {
        provider: 'anthropic',
        content: message.content[0].text,
        usage: message.usage,
        model: message.model,
      };

      this.logger.info('Anthropic генерация завершена успешно', {
        model: message.model,
        tokens: message.usage.input_tokens + message.usage.output_tokens,
      });

      return result;
    } catch (error) {
      this.logger.error('Ошибка Anthropic', error);
      throw new Error(`Anthropic ошибка: ${error.message}`);
    }
  }

  /**
   * Генерация текста через Google AI
   */
  async generateWithGoogle(prompt, options = {}) {
    try {
      this.logger.info('Google AI генерация начата', { prompt: prompt.substring(0, 100) });
      
      const {
        model = 'gemini-pro',
        maxOutputTokens = 1000,
        temperature = 0.7,
        topP = 0.8,
        topK = 10,
      } = options;

      const genAI = this.googleAI.getGenerativeModel({ model });
      
      const result = await genAI.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens,
          temperature,
          topP,
          topK,
        },
      });

      const response = result.response;
      const text = response.text();

      const result_data = {
        provider: 'google',
        content: text,
        usage: response.usageMetadata,
        model: model,
      };

      this.logger.info('Google AI генерация завершена успешно', {
        model: model,
        tokens: response.usageMetadata.totalTokenCount,
      });

      return result_data;
    } catch (error) {
      this.logger.error('Ошибка Google AI', error);
      throw new Error(`Google AI ошибка: ${error.message}`);
    }
  }

  /**
   * Универсальный метод генерации текста
   */
  async generateText(data) {
    try {
      this.validateAIRequest(data);
      
      const { prompt, provider, options = {} } = data;
      
      switch (provider) {
        case 'openai':
          return await this.generateWithOpenAI(prompt, options);
        case 'anthropic':
          return await this.generateWithAnthropic(prompt, options);
        case 'google':
          return await this.generateWithGoogle(prompt, options);
        default:
          throw new Error(`Неподдерживаемый провайдер: ${provider}`);
      }
    } catch (error) {
      this.logger.error('Ошибка генерации текста', error);
      throw error;
    }
  }

  /**
   * Создание embedding через OpenAI
   */
  async createEmbedding(text, options = {}) {
    try {
      this.logger.info('OpenAI embedding создание начато');
      
      const {
        model = 'text-embedding-ada-002',
        input = text,
      } = options;

      const embedding = await this.openai.embeddings.create({
        model,
        input,
      });

      const result = {
        provider: 'openai',
        embedding: embedding.data[0].embedding,
        usage: embedding.usage,
        model: embedding.model,
      };

      this.logger.info('OpenAI embedding создан успешно', {
        model: embedding.model,
        dimensions: embedding.data[0].embedding.length,
      });

      return result;
    } catch (error) {
      this.logger.error('Ошибка создания embedding', error);
      throw new Error(`Ошибка embedding: ${error.message}`);
    }
  }

  /**
   * Анализ изображения через OpenAI Vision
   */
  async analyzeImage(imageData, prompt = 'Опишите это изображение', options = {}) {
    try {
      this.logger.info('OpenAI Vision анализ изображения начат');
      
      const {
        model = 'gpt-4-vision-preview',
        maxTokens = 300,
        detail = 'high',
      } = options;

      const completion = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: imageData,
                  detail,
                },
              },
            ],
          },
        ],
        max_tokens: maxTokens,
      });

      const result = {
        provider: 'openai',
        content: completion.choices[0].message.content,
        usage: completion.usage,
        model: completion.model,
      };

      this.logger.info('OpenAI Vision анализ завершен успешно');

      return result;
    } catch (error) {
      this.logger.error('Ошибка анализа изображения', error);
      throw new Error(`Ошибка анализа изображения: ${error.message}`);
    }
  }

  /**
   * Сравнение ответов от разных AI провайдеров
   */
  async compareProviders(prompt, providers = ['openai', 'anthropic', 'google'], options = {}) {
    try {
      this.logger.info('Сравнение AI провайдеров начато', { prompt: prompt.substring(0, 100) });
      
      const results = [];
      
      for (const provider of providers) {
        try {
          const result = await this.generateText({
            prompt,
            provider,
            options,
          });
          results.push({
            provider,
            ...result,
          });
        } catch (error) {
          this.logger.warn(`Ошибка провайдера ${provider}`, error);
          results.push({
            provider,
            error: error.message,
          });
        }
      }

      this.logger.info('Сравнение провайдеров завершено', {
        successful: results.filter(r => !r.error).length,
        total: providers.length,
      });

      return results;
    } catch (error) {
      this.logger.error('Ошибка сравнения провайдеров', error);
      throw error;
    }
  }
}

module.exports = new AIService();