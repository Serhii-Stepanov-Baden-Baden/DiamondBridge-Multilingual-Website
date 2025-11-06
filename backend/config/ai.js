const config = require('./environment');

module.exports = {
  // OpenAI Configuration
  openai: {
    apiKey: config.OPENAI_API_KEY,
    organization: config.OPENAI_ORG_ID,
    baseURL: config.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    timeout: parseInt(config.OPENAI_TIMEOUT) || 30000,
    maxRetries: parseInt(config.OPENAI_MAX_RETRIES) || 3,
    models: {
      chat: config.OPENAI_CHAT_MODEL || 'gpt-4',
      embedding: config.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002',
      vision: config.OPENAI_VISION_MODEL || 'gpt-4-vision-preview',
      moderation: config.OPENAI_MODERATION_MODEL || 'text-moderation-stable'
    },
    pricing: {
      gpt4: { input: 0.03, output: 0.06 }, // per 1K tokens
      gpt35: { input: 0.0015, output: 0.002 },
      embedding: { input: 0.0001 }
    }
  },

  // Claude (Anthropic) Configuration
  claude: {
    apiKey: config.ANTHROPIC_API_KEY,
    baseURL: config.ANTHROPIC_BASE_URL || 'https://api.anthropic.com',
    timeout: parseInt(config.CLAUDE_TIMEOUT) || 30000,
    maxTokens: parseInt(config.CLAUDE_MAX_TOKENS) || 4096,
    models: {
      claude3: config.CLAUDE3_MODEL || 'claude-3-sonnet-20240229',
      claude2: config.CLAUDE2_MODEL || 'claude-2.1'
    }
  },

  // Google AI Configuration
  googleAI: {
    apiKey: config.GOOGLE_AI_API_KEY,
    baseURL: config.GOOGLE_AI_BASE_URL || 'https://generativelanguage.googleapis.com/v1',
    timeout: parseInt(config.GOOGLE_AI_TIMEOUT) || 30000,
    models: {
      gemini: config.GEMINI_MODEL || 'gemini-pro',
      geminiVision: config.GEMINI_VISION_MODEL || 'gemini-pro-vision'
    }
  },

  // Local AI Models (Ollama, etc.)
  localAI: {
    enabled: config.LOCAL_AI_ENABLED === 'true',
    baseURL: config.LOCAL_AI_BASE_URL || 'http://localhost:11434',
    timeout: parseInt(config.LOCAL_AI_TIMEOUT) || 60000,
    models: {
      llm: config.LOCAL_LLM_MODEL || 'llama2',
      embedding: config.LOCAL_EMBEDDING_MODEL || 'nomic-embed-text'
    }
  },

  // Vector Database Configuration
  vectorDB: {
    provider: config.VECTOR_DB_PROVIDER || 'pinecone', // pinecone, weaviate, qdrant, local
    apiKey: config.VECTOR_DB_API_KEY,
    environment: config.VECTOR_DB_ENVIRONMENT,
    indexName: config.VECTOR_DB_INDEX || 'diamondbridge-knowledge',
    dimension: parseInt(config.VECTOR_DB_DIMENSION) || 1536,
    metric: config.VECTOR_DB_METRIC || 'cosine',
    // Pinecone specific
    pinecone: {
      projectId: config.PINECONE_PROJECT_ID,
      region: config.PINECONE_REGION || 'us-west1-gcp'
    },
    // Weaviate specific
    weaviate: {
      baseURL: config.WEAVIATE_URL || 'http://localhost:8080',
      apiKey: config.WEAVIATE_API_KEY
    },
    // Qdrant specific
    qdrant: {
      baseURL: config.QDRANT_URL || 'http://localhost:6333',
      apiKey: config.QDRANT_API_KEY
    }
  },

  // Speech-to-Text Configuration
  speechToText: {
    provider: config.STT_PROVIDER || 'openai', // openai, google, azure
    model: config.STT_MODEL || 'whisper-1',
    language: config.STT_LANGUAGE || 'ru',
    // OpenAI Whisper
    openai: {
      apiKey: config.OPENAI_API_KEY,
      model: 'whisper-1',
      responseFormat: 'json',
      temperature: 0
    },
    // Google Speech-to-Text
    google: {
      credentials: config.GOOGLE_CREDENTIALS,
      languageCode: config.GOOGLE_STT_LANGUAGE || 'ru-RU',
      sampleRateHertz: parseInt(config.GOOGLE_STT_SAMPLE_RATE) || 16000
    }
  },

  // Text-to-Speech Configuration
  textToSpeech: {
    provider: config.TTS_PROVIDER || 'openai', // openai, google, azure, elevenlabs
    voice: config.TTS_VOICE || 'alloy',
    model: config.TTS_MODEL || 'tts-1',
    speed: parseFloat(config.TTS_SPEED) || 1.0,
    // OpenAI TTS
    openai: {
      apiKey: config.OPENAI_API_KEY,
      model: 'tts-1',
      voice: 'alloy',
      responseFormat: 'mp3'
    },
    // ElevenLabs
    elevenlabs: {
      apiKey: config.ELEVENLABS_API_KEY,
      voiceId: config.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'
    }
  },

  // Image Generation Configuration
  imageGeneration: {
    provider: config.IMAGE_GEN_PROVIDER || 'openai', // openai, dalle, midjourney, stability
    model: config.IMAGE_GEN_MODEL || 'dall-e-3',
    size: config.IMAGE_GEN_SIZE || '1024x1024',
    quality: config.IMAGE_GEN_QUALITY || 'hd',
    // OpenAI DALL-E
    openai: {
      apiKey: config.OPENAI_API_KEY,
      model: 'dall-e-3',
      size: '1024x1024',
      quality: 'hd',
      style: 'vivid'
    },
    // Stability AI
    stability: {
      apiKey: config.STABILITY_API_KEY,
      model: 'stable-diffusion-xl-1024-v1-0',
      steps: parseInt(config.STABILITY_STEPS) || 30,
      cfgScale: parseFloat(config.STABILITY_CFG_SCALE) || 7
    }
  },

  // Document Processing Configuration
  documentProcessing: {
    enabled: config.DOCUMENT_PROCESSING_ENABLED === 'true',
    maxFileSize: parseInt(config.MAX_DOCUMENT_SIZE) || 50 * 1024 * 1024, // 50MB
    allowedFormats: ['pdf', 'docx', 'txt', 'md', 'html'],
    ocr: {
      provider: config.OCR_PROVIDER || 'tesseract',
      language: config.OCR_LANGUAGE || 'rus+eng'
    },
    chunkSize: parseInt(config.CHUNK_SIZE) || 1000,
    chunkOverlap: parseInt(config.CHUNK_OVERLAP) || 200
  },

  // RAG (Retrieval-Augmented Generation) Configuration
  rag: {
    enabled: config.RAG_ENABLED === 'true',
    topK: parseInt(config.RAG_TOP_K) || 5,
    similarityThreshold: parseFloat(config.RAG_SIMILARITY_THRESHOLD) || 0.7,
    maxContextLength: parseInt(config.RAG_MAX_CONTEXT_LENGTH) || 4000,
    promptTemplate: config.RAG_PROMPT_TEMPLATE || `
Отвечай на вопрос, используя следующий контекст:
{context}

Вопрос: {question}
Ответ:`
  },

  // AI Agent Configuration
  agents: {
    enabled: config.AI_AGENTS_ENABLED === 'true',
    maxConcurrent: parseInt(config.AI_MAX_CONCURRENT) || 5,
    timeout: parseInt(config.AI_AGENT_TIMEOUT) || 30000,
    memoryLimit: parseInt(config.AI_MEMORY_LIMIT) || 100, // MB
    // Agent Types
    types: {
      chatbot: {
        model: config.CHATBOT_MODEL || 'gpt-4',
        temperature: parseFloat(config.CHATBOT_TEMPERATURE) || 0.7,
        maxTokens: parseInt(config.CHATBOT_MAX_TOKENS) || 2000
      },
      assistant: {
        model: config.ASSISTANT_MODEL || 'gpt-4',
        temperature: parseFloat(config.ASSISTANT_TEMPERATURE) || 0.3,
        maxTokens: parseInt(config.ASSISTANT_MAX_TOKENS) || 4000
      },
      translator: {
        model: config.TRANSLATOR_MODEL || 'gpt-3.5-turbo',
        temperature: parseFloat(config.TRANSLATOR_TEMPERATURE) || 0.1,
        supportedLanguages: ['ru', 'en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko']
      }
    }
  },

  // Rate Limiting for AI Services
  rateLimit: {
    requestsPerMinute: parseInt(config.AI_REQUESTS_PER_MINUTE) || 60,
    requestsPerHour: parseInt(config.AI_REQUESTS_PER_HOUR) || 1000,
    burstLimit: parseInt(config.AI_BURST_LIMIT) || 10
  },

  // Caching Configuration
  cache: {
    enabled: config.AI_CACHE_ENABLED === 'true',
    ttl: parseInt(config.AI_CACHE_TTL) || 3600, // 1 hour
    maxSize: parseInt(config.AI_CACHE_MAX_SIZE) || 1000 // Number of entries
  },

  // Monitoring and Analytics
  monitoring: {
    enabled: config.AI_MONITORING_ENABLED === 'true',
    trackUsage: config.AI_TRACK_USAGE === 'true',
    trackCosts: config.AI_TRACK_COSTS === 'true',
    trackPerformance: config.AI_TRACK_PERFORMANCE === 'true'
  }
};