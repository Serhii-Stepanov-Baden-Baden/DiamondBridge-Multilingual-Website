import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '../i18n/Context';
import { useMutation } from '@tanstack/react-query';
import { apiClient, ChatMessage, ChatRequest } from '../services/api';
import toast from 'react-hot-toast';

export function AIChatSection() {
  const { t } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: t('aiChat.welcome') as string,
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatMutation = useMutation({
    mutationFn: (request: ChatRequest) => apiClient.sendChatMessage(request),
    onMutate: () => {
      // Add user message immediately
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: inputMessage,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      // Add loading message
      const loadingMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: t('aiChat.typingIndicator') as string,
        timestamp: new Date(),
        isLoading: true,
      };
      setMessages(prev => [...prev, loadingMessage]);
      setInputMessage('');
    },
    onSuccess: (response) => {
      if (response.success && response.data) {
        setMessages(prev => {
          const withoutLoading = prev.filter(msg => !msg.isLoading);
          return [
            ...withoutLoading,
            {
              id: Date.now().toString(),
              role: 'assistant',
              content: response.data.response,
              timestamp: new Date(),
            }
          ];
        });
      }
    },
    onError: () => {
      toast.error(t('aiChat.error') as string);
      setMessages(prev => {
        const withoutLoading = prev.filter(msg => !msg.isLoading);
        return withoutLoading;
      });
    },
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    chatMutation.mutate({ message: inputMessage });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: t('aiChat.welcome') as string,
        timestamp: new Date(),
      }
    ]);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <section id="ai-chat" className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {t('aiChat.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('aiChat.description')}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Chat Header */}
          <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold">AI</span>
              </div>
              <span className="font-semibold">AI Assistant</span>
            </div>
            <button
              onClick={clearChat}
              className="text-blue-200 hover:text-white transition-colors"
            >
              {t('aiChat.clearButton')}
            </button>
          </div>

          {/* Chat Messages */}
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  } ${message.isLoading ? 'animate-pulse' : ''}`}
                >
                  {message.isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm">{message.content}</span>
                    </div>
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex space-x-2">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('aiChat.inputPlaceholder') as string}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={1}
                disabled={chatMutation.isPending}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || chatMutation.isPending}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {chatMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  t('aiChat.sendButton')
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}