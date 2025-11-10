import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLanguage } from '../i18n/Context';
import { sendMessage } from '../services/api';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const AIChatSection: React.FC = () => {
  const { t, currentLanguage } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    setMessages([{
      id: crypto.randomUUID(),
      text: t('aiChat.welcome'),
      isUser: false,
      timestamp: new Date()
    }]);
  }, [t]);

  const handleSendMessage = useCallback(async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      text: trimmed,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await sendMessage(trimmed, currentLanguage);
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        text: response,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        text: t('aiChat.error'),
        isUser: false,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  }, [inputText, isLoading, currentLanguage, t]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <section className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 shadow-xl border border-blue-200">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">{t('aiChat.title')}</h2>
        <p className="text-gray-600">{t('aiChat.subtitle')}</p>
      </div>

      <div className="bg-white rounded-xl shadow-inner border border-gray-200 overflow-hidden">
        <div className="h-96 overflow-y-auto p-4 space-y-4">
          {messages.map(({ id, text, isUser, timestamp }) => (
            <div key={id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm
                ${isUser ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                <p className="text-sm leading-relaxed">{text}</p>
                <p className={`text-xs mt-1 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                  {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-bl-sm px-4 py-2">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    {[0, 0.1, 0.2].map((delay, i) => (
                      <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${delay}s` }} />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">{t('aiChat.thinking')}</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-200 p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('aiChat.placeholder')}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
              aria-busy={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200
                ${inputText.trim() && !isLoading
                  ? 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
            >
              {t('aiChat.send')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIChatSection;
