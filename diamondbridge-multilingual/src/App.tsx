// App.tsx - Обновлённая версия с многоязычностью и ИИ чатом

import React from 'react';
import { LanguageProvider, useLanguage } from './i18n/Context';
import LanguageSwitcher from './components/LanguageSwitcher';
import AIChatSection from './components/AIChatSection';
import './index.css';

// Компонент с основным контентом (внутри провайдера)
const MainContent: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Навигация */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                💎 DiamondBridge
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </nav>

      {/* Главный контент */}
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Hero секция */}
        <section className="text-center mb-16 fade-in">
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
            {t('home.hero.title')}
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            {t('home.hero.subtitle')}
          </p>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            {t('home.hero.description')}
          </p>
        </section>

        {/* Features */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            {t('home.features.title')}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="text-5xl mb-4">🌍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {t('home.features.multilingual.title')}
              </h3>
              <p className="text-gray-600">
                {t('home.features.multilingual.description')}
              </p>
            </div>
            
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="text-5xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {t('home.features.ai.title')}
              </h3>
              <p className="text-gray-600">
                {t('home.features.ai.description')}
              </p>
            </div>
            
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {t('home.features.performance.title')}
              </h3>
              <p className="text-gray-600">
                {t('home.features.performance.description')}
              </p>
            </div>
          </div>
        </section>

        {/* ИИ Чат секция */}
        <AIChatSection />
      </main>

      {/* Подвал */}
      <footer className="bg-white/60 backdrop-blur-md border-t border-white/20 mt-20">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600">
            Создано с ❤️ используя <span className="font-semibold text-blue-600">MiniMax AI</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

// Основной App компонент
function App() {
  return (
    <LanguageProvider>
      <MainContent />
    </LanguageProvider>
  );
}

export default App;
