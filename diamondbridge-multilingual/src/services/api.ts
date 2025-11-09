// api.ts - Интеграция с MiniMax API

// Конфигурация API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://jsonplaceholder.typicode.com';
const MINIMAX_API_KEY = import.meta.env.VITE_MINIMAX_API_KEY;
const MINIMAX_GROUP_ID = import.meta.env.VITE_MINIMAX_GROUP_ID;
const ENABLE_MINIMAX = import.meta.env.VITE_ENABLE_MINIMAX === 'true';

// Интерфейсы
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

// Demo данные для отладки
const demoResponses: Record<string, string[]> = {
  ru: [
    'Привет! Я ваш ИИ-помощник от MiniMax. Чем могу помочь?',
    'Отличный вопрос! Позвольте мне подумать о том, что вы спросили.',
    'Я всегда готов помочь вам с любыми вопросами!',
    'Это интересная тема! Расскажите мне больше деталей.',
    'Понял ваш вопрос. Вот что я об этом думаю...'
  ],
  en: [
    'Hello! I am your AI assistant from MiniMax. How can I help you?',
    'Great question! Let me think about what you asked.',
    'I am always ready to help you with any questions!',
    'That\'s an interesting topic! Tell me more details.',
    'I understand your question. Here\'s what I think about it...'
  ],
  de: [
    'Hallo! Ich bin Ihr KI-Assistent von MiniMax. Wie kann ich helfen?',
    'Eine gute Frage! Lassen Sie mich über Ihre Anfrage nachdenken.',
    'Ich bin immer bereit, Ihnen mit jeder Frage zu helfen!',
    'Das ist ein interessantes Thema! Erzählen Sie mir mehr Details.',
    'Ich verstehe Ihre Frage. Hier ist, was ich darüber denke...'
  ],
  fr: [
    'Bonjour! Je suis votre assistant IA de MiniMax. Comment puis-je vous aider?',
    'Excellente question! Laissez-moi réfléchir à ce que vous avez demandé.',
    'Je suis toujours prêt à vous aider avec toutes les questions!',
    'C\'est un sujet intéressant! Dites-moi plus de détails.',
    'Je comprends votre question. Voici ce que j\'en pense...'
  ],
  es: [
    '¡Hola! Soy tu asistente de IA de MiniMax. ¿Cómo puedo ayudarte?',
    '¡Excelente pregunta! Déjame pensar en lo que preguntaste.',
    '¡Siempre estoy listo para ayudarte con cualquier pregunta!',
    '¡Ese es un tema interesante! Cuéntame más detalles.',
    'Entiendo tu pregunta. Aquí está lo que pienso al respecto...'
  ],
  it: [
    'Ciao! Sono il tuo assistente IA di MiniMax. Come posso aiutarti?',
    'Ottima domanda! Lasciami pensare a quello che hai chiesto.',
    'Sono sempre pronto ad aiutarti con qualsiasi domanda!',
    'È un argomento interessante! Dimmi più dettagli.',
    'Capisco la tua domanda. Ecco cosa penso al riguardo...'
  ],
  ja: [
    'こんにちは！私はMiniMaxのAIアシスタントです。どのようにお手伝いできますでしょうか？',
    '素晴らしい質問ですね！ジャガ何をご質問されたか考えてみます。',
    'どのようなご質問でもお手伝いする準備ができております！',
    '興味深いトピックです！もっと詳細をお聞かせください。',
    'ご質問を理解いたしました。以下が私の考えです...'
  ],
  zh: [
    '你好！我是您的MiniMax AI助手。有什么可以帮助您的吗？',
    '好问题！让我想想您问的是什么。',
    '我随时准备帮助您解决任何问题！',
    '这是个有趣的话题！请告诉我更多细节。',
    '我理解您的问题。这就是我对此的想法...'
  ]
};

// Получить демо-ответ
const getDemoResponse = async (message: string, language: string = 'ru'): Promise<string> => {
  // Имитируем задержку сети
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  const responses = demoResponses[language] || demoResponses.ru;
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
};

// Отправить сообщение в MiniMax API
export const sendMessage = async (message: string, language: string = 'ru'): Promise<string> => {
  // В продакшене включить реальный API
  if (ENABLE_MINIMAX && MINIMAX_API_KEY && MINIMAX_GROUP_ID) {
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
      // Фоллбэк на демо
      return getDemoResponse(message, language);
    }
  } else {
    // Демо режим
    return getDemoResponse(message, language);
  }
};

// Проверить статус соединения
export const checkConnection = async (): Promise<boolean> => {
  try {
    if (ENABLE_MINIMAX) {
      const response = await fetch(`${API_BASE_URL}/models`, {
        headers: {
          'Authorization': `Bearer ${MINIMAX_API_KEY}`,
        },
      });
      return response.ok;
    }
    return true; // Демо всегда "работает"
  } catch (error) {
    console.error('Connection check failed:', error);
    return false;
  }
};

// Получить доступные языки
export const getSupportedLanguages = (): string[] => {
  return Object.keys(demoResponses);
};

export default { sendMessage, checkConnection, getSupportedLanguages };
