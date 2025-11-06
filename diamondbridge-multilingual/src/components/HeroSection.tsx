import React from 'react';
import { useI18n } from '../i18n/Context';

export function HeroSection() {
  const { t } = useI18n();

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="pt-16 min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            {t('hero.title')}
          </h1>

          {/* Description */}
          <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
            {t('hero.description')}
          </p>

          {/* Quote */}
          <blockquote className="text-lg text-gray-700 italic max-w-4xl mx-auto mb-12 border-l-4 border-blue-600 pl-6">
            "{t('hero.quote')}"
          </blockquote>

          {/* Call to Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <button
              onClick={() => scrollToSection('#solution')}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              {t('hero.learnSolution')}
            </button>
            <button
              onClick={() => scrollToSection('#about')}
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              {t('hero.aboutProject')}
            </button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">50%</div>
              <div className="text-gray-700">{t('stats.profitToAuthor')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">100%</div>
              <div className="text-gray-700">{t('stats.authorshipProtection')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">30%</div>
              <div className="text-gray-700">{t('stats.developmentFund')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">∞</div>
              <div className="text-gray-700">{t('stats.globalNetwork')}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}