import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import toast from 'react-hot-toast';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://jsonplaceholder.typicode.com';
const MOCK_API_URL = import.meta.env.VITE_MOCK_API_URL || 'https://mockapi.io';
const ENABLE_MOCK_API = import.meta.env.VITE_ENABLE_MOCK_API === 'true';
const MOCK_API_DELAY = parseInt(import.meta.env.VITE_MOCK_API_DELAY || '1000');

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

// AI API Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

export interface ChatRequest {
  message: string;
  context?: string;
  model?: string;
}

export interface ChatResponse {
  response: string;
  context?: string;
  model?: string;
  confidence?: number;
}

// Media API Types
export interface MediaUploadRequest {
  file: File;
  operation?: string;
  options?: Record<string, any>;
}

export interface MediaUploadResponse {
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface MediaProcessRequest {
  fileId: string;
  operation: 'analyze' | 'enhance' | 'resize' | 'compress' | 'convert';
  options?: Record<string, any>;
}

export interface MediaProcessResponse {
  processedFileId: string;
  originalFileId: string;
  operation: string;
  resultUrl: string;
  metadata: Record<string, any>;
}

// Drive API Types
export interface DriveAuthRequest {
  code: string;
}

export interface DriveAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: Date;
  modifiedAt: Date;
  webViewLink: string;
  thumbnailUrl?: string;
}

export interface DriveUploadRequest {
  file: File;
  folderId?: string;
}

export interface DriveDownloadRequest {
  fileId: string;
}

// Health API Types
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  services: {
    ai: ServiceStatus;
    media: ServiceStatus;
    drive: ServiceStatus;
    database: ServiceStatus;
  };
  uptime: number;
  version: string;
}

export interface ServiceStatus {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  lastCheck: Date;
  error?: string;
}

// Simulated AI Responses for demo
const SIMULATED_AI_RESPONSES = [
  "I understand you're looking for creative collaboration! Let me help you develop your idea step by step.",
  "That's an interesting concept! Have you considered how AI could enhance the user experience?",
  "Based on your description, I see potential for innovation. What specific challenges are you trying to solve?",
  "Your idea aligns well with current market trends. I suggest focusing on the core value proposition first.",
  "That's a brilliant approach! Let's explore how we can protect your intellectual property through DiamondBridge.",
  "I can help you structure this idea for maximum impact. What's your timeline for implementation?",
  "Great thinking! This could benefit from our AI-enhanced development process. Shall we proceed?",
  "Your vision is compelling. Let's discuss how to turn this into a viable product or service.",
  "Excellent idea! I can see several ways to leverage AI for optimization and growth.",
  "That's exactly the kind of innovation DiamondBridge was designed to support. How can we help?"
];

// Mock API Response Generators
const generateMockAIResponse = (message: string): ChatResponse => {
  const responses = SIMULATED_AI_RESPONSES;
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  return {
    response: randomResponse,
    context: `Understanding: "${message.substring(0, 50)}..."`,
    model: "DiamondBridge AI v3.0",
    confidence: 0.85 + Math.random() * 0.14
  };
};

const generateMockMediaResponse = (file: File): MediaUploadResponse => {
  return {
    fileId: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
    uploadedAt: new Date()
  };
};

const generateMockDriveFiles = (): DriveFile[] => {
  return [
    {
      id: '1',
      name: 'Project_Proposal.pdf',
      mimeType: 'application/pdf',
      size: 2048576,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      modifiedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      webViewLink: 'https://drive.google.com/file/d/mock1/view'
    },
    {
      id: '2', 
      name: 'AI_Meeting_Notes.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 1024768,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      modifiedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      webViewLink: 'https://drive.google.com/file/d/mock2/view'
    },
    {
      id: '3',
      name: 'DiamondBridge_Logo.png',
      mimeType: 'image/png',
      size: 524288,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      modifiedAt: new Date(),
      webViewLink: 'https://drive.google.com/file/d/mock3/view',
      thumbnailUrl: 'https://drive.google.com/thumbnail?id=mock3'
    }
  ];
};

const generateMockHealthStatus = (): HealthStatus => {
  return {
    status: 'healthy',
    timestamp: new Date(),
    services: {
      ai: {
        status: 'up',
        responseTime: 150 + Math.random() * 100,
        lastCheck: new Date()
      },
      media: {
        status: 'up',
        responseTime: 200 + Math.random() * 100,
        lastCheck: new Date()
      },
      drive: {
        status: 'up',
        responseTime: 300 + Math.random() * 150,
        lastCheck: new Date()
      },
      database: {
        status: 'up',
        responseTime: 50 + Math.random() * 50,
        lastCheck: new Date()
      }
    },
    uptime: 86400 + Math.random() * 3600, // 24-25 hours
    version: '3.0.0'
  };
};

// API Client Class
class ApiClient {
  private client: AxiosInstance;
  private retryCount: number = 2;
  private retryDelay: number = 1000;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('diamondbridge-auth-token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Handle network errors
        if (!error.response) {
          toast.error('Ошибка сети. Проверьте подключение к интернету.');
          return Promise.reject(new Error('Network error'));
        }

        const { status, data } = error.response;

        // Handle different error status codes
        switch (status) {
          case 401:
            localStorage.removeItem('diamondbridge-auth-token');
            toast.error('Требуется авторизация');
            break;
          
          case 403:
            toast.error('Доступ запрещен');
            break;
          
          case 404:
            toast.error('Ресурс не найден');
            break;
          
          case 429:
            toast.error('Слишком много запросов. Попробуйте позже.');
            break;
          
          case 500:
            toast.error('Ошибка сервера. Попробуйте позже.');
            break;
          
          default:
            if (data && (data as any).message) {
              toast.error((data as any).message);
            } else {
              toast.error('Произошла неизвестная ошибка');
            }
        }

        // Retry logic for certain status codes
        if (status >= 500 && status < 600 && originalRequest && !originalRequest._retry) {
          originalRequest._retry = true;
          
          for (let i = 0; i < this.retryCount; i++) {
            await new Promise(resolve => setTimeout(resolve, this.retryDelay * Math.pow(2, i)));
            try {
              return await this.client(originalRequest);
            } catch (retryError) {
              if (i === this.retryCount - 1) {
                throw retryError;
              }
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    data?: any,
    config?: any
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.request({
        method,
        url,
        data,
        ...config,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      return {
        success: false,
        error: {
          message: axiosError.message,
          code: axiosError.code,
          details: axiosError.response?.data,
        },
      };
    }
  }

  // AI API Methods (Using Mock for Demo)
  async sendChatMessage(request: ChatRequest): Promise<ApiResponse<ChatResponse>> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
      
      // For demo, generate mock response
      const response = generateMockAIResponse(request.message);
      
      // In real implementation, this would call:
      // return this.request<ChatResponse>('POST', '/api/ai/conversation', request);
      
      return {
        success: true,
        data: response
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Failed to get AI response',
          details: error
        }
      };
    }
  }

  async getNLPAnalysis(text: string): Promise<ApiResponse<any>> {
    try {
      // Mock NLP analysis response
      const analysis = {
        sentiment: 'positive',
        keywords: ['innovation', 'AI', 'technology'],
        entities: ['DiamondBridge', 'AI'],
        confidence: 0.85
      };
      
      return {
        success: true,
        data: analysis
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Failed to analyze text',
          details: error
        }
      };
    }
  }

  async trainModel(data: any): Promise<ApiResponse<any>> {
    // Mock training response
    return {
      success: true,
      data: { status: 'training_initiated', model_id: 'mock_model_123' }
    };
  }

  // Media API Methods
  async uploadMedia(request: MediaUploadRequest): Promise<ApiResponse<MediaUploadResponse>> {
    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY * 2));
      
      const response = generateMockMediaResponse(request.file);
      
      return {
        success: true,
        data: response
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'File upload failed',
          details: error
        }
      };
    }
  }

  async processMedia(request: MediaProcessRequest): Promise<ApiResponse<MediaProcessResponse>> {
    try {
      await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY * 3));
      
      const response = {
        processedFileId: `processed_${request.fileId}`,
        originalFileId: request.fileId,
        operation: request.operation,
        resultUrl: `https://example.com/processed/${request.fileId}`,
        metadata: {
          originalSize: '2MB',
          processedSize: '1.5MB',
          processingTime: '2.3s',
          quality: 'enhanced'
        }
      };
      
      return {
        success: true,
        data: response
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Media processing failed',
          details: error
        }
      };
    }
  }

  async analyzeMedia(fileId: string): Promise<ApiResponse<any>> {
    // Mock analysis result
    return {
      success: true,
      data: {
        type: 'image',
        dimensions: '1920x1080',
        colors: ['blue', 'white', 'gray'],
        objects: ['logo', 'text', 'background'],
        quality: 'high',
        ai_confidence: 0.92
      }
    };
  }

  // Drive API Methods
  async authenticateDrive(request: DriveAuthRequest): Promise<ApiResponse<DriveAuthResponse>> {
    try {
      // Simulate OAuth flow
      await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
      
      // In real implementation, this would exchange code for tokens
      const response: DriveAuthResponse = {
        accessToken: 'mock_access_token_12345',
        refreshToken: 'mock_refresh_token_67890',
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
        user: {
          id: 'user_123',
          email: 'user@example.com',
          name: 'Demo User'
        }
      };
      
      return {
        success: true,
        data: response
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Drive authentication failed',
          details: error
        }
      };
    }
  }

  async getDriveFiles(): Promise<ApiResponse<DriveFile[]>> {
    try {
      await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
      
      const files = generateMockDriveFiles();
      
      return {
        success: true,
        data: files
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Failed to fetch Drive files',
          details: error
        }
      };
    }
  }

  async uploadToDrive(request: DriveUploadRequest): Promise<ApiResponse<DriveFile>> {
    try {
      await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY * 2));
      
      const file: DriveFile = {
        id: `drive_file_${Date.now()}`,
        name: request.file.name,
        mimeType: request.file.type,
        size: request.file.size,
        createdAt: new Date(),
        modifiedAt: new Date(),
        webViewLink: `https://drive.google.com/file/d/${Date.now()}/view`
      };
      
      return {
        success: true,
        data: file
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Failed to upload to Drive',
          details: error
        }
      };
    }
  }

  async downloadFromDrive(request: DriveDownloadRequest): Promise<ApiResponse<Blob>> {
    // Mock download
    const blob = new Blob(['Mock file content'], { type: 'application/octet-stream' });
    return {
      success: true,
      data: blob
    };
  }

  // Health API Methods
  async getHealthStatus(): Promise<ApiResponse<HealthStatus>> {
    try {
      // Simulate health check delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const status = generateMockHealthStatus();
      
      return {
        success: true,
        data: status
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Failed to get health status',
          details: error
        }
      };
    }
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient();
export default apiClient;