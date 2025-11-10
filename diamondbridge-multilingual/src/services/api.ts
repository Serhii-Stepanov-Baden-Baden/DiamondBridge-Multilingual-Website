// api.ts — Интеграция с MiniMax API + демо-режим

// 🔧 Конфигурация
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://jsonplaceholder.typicode.com';
const MINIMAX_API_KEY = import.meta.env.VITE_MINIMAX_API_KEY;
const MINIMAX_GROUP_ID = import.meta.env.VITE_MINIMAX_GROUP_ID;
const ENABLE_MINIMAX = import.meta.env.VITE_ENABLE_MINIMAX === 'true';

// ✅ Проверка готовности MiniMax
const isMiniMaxReady = (): boolean =>
  ENABLE_MINIMAX && !!MINIMAX_API_KEY && !!MINIMAX_GROUP_ID;

// 🧠 Интерфейсы
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// 💬 Демо-ответы
export const demoResponses: Record<string, string[]> = {
  ru: ['Привет! Чем могу помочь?', 'Какой у вас вопрос?', 'Я здесь, чтобы помочь.'],
  en: ['Hello! How can I assist you?', 'What would you like to know?', 'I\'m here to help.'],
  de: ['Hallo! Wie kann ich helfen?', 'Was möchten Sie wissen?', 'Ich bin für Sie da.'],
  fr: ['Bonjour! Comment puis-je vous aider?', 'Que souhaitez-vous savoir?', 'Je suis là pour vous aider.'],
  es: ['¡Hola! ¿En qué puedo ayudarte?', '¿Qué necesitas saber?', 'Estoy aquí para ayudarte.'],
  it: ['Ciao! Come posso aiutarti?', 'Cosa vuoi sapere?', 'Sono qui per aiutarti.'],
  ja: ['こんにちは！どうお手伝いできますか？', '何を知りたいですか？', 'お手伝いします。'],
  zh: ['你好！我可以帮你什么？', '你想了解什么？', '我在这里为您服务。']
};

// 🧪 Получить демо-ответ
export const getDemoResponse = async (message: string, language: string = 'ru'): Promise<string> => {
  console.log(`[Demo] Responding in ${language}`);
  if (!demoResponses[language]) {
    console.warn(`Language "${language}" not found. Falling back to Russian.`);
  }

  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  const responses = demoResponses[language] || demoResponses.ru;
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
};

// 🚀 Отправить сообщение в MiniMax API
export const sendMessage = async (message: string, language: string = 'ru'): Promise<string> => {
  if (isMiniMaxReady()) {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MINIMAX_API_KEY}`,
          'GroupId': MINIMAX_GROUP_ID,
        },
        body: JSON.stringify({
          model: 'abab6.5s-chat',
          messages: [
            {
              role: 'system',
              content: `You are a helpful AI assistant. Respond in the user's language: ${language}. Be friendly and informative.`
            },
            {
              role: 'user',
              content: message
            }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data: ChatResponse = await response.json();
      return data.choices[0]?.message?.content || 'Извините, не удалось получить ответ.';
    } catch (error) {
      console.error('MiniMax API error:', error);
      return getDemoResponse(message, language);
    }
  } else {
    return getDemoResponse(message, language);
  }
};

// 📡 Проверить соединение
export const checkConnection = async (): Promise<boolean> => {
  try {
    if (isMiniMaxReady()) {
      const response = await fetch(`${API_BASE_URL}/models`, {
        headers: {
          'Authorization': `Bearer ${MINIMAX_API_KEY}`,
        },
      });
      return response.ok;
    }
    return true;
  } catch (error) {
    console.error('Connection check failed:', error);
    return false;
  }
};

// 🌍 Получить список поддерживаемых языков
export const getSupportedLanguages = (): string[] => {
  return Object.keys(demoResponses);
};

// 🧩 Универсальный клиент
export const apiClient = async (url: string, options?: RequestInit): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}${url}`, options);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
};
