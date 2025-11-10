import React from 'react';
import { useLanguage } from '../i18n/Context';

export function GeniusHubsSection() {
  const { t } = useLanguage();

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="genius-hubs" className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            {t('geniusHubs.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('geniusHubs.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Innovation Hub */}
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">{t('geniusHubs.innovationHub.title')}</h3>
            <p className="text-gray-600 text-center">
              {t('geniusHubs.innovationHub.description')}
            </p>
          </div>

          {/* Learning Center */}
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl">🎓</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">{t('geniusHubs.learningCenter.title')}</h3>
            <p className="text-gray-600 text-center">
              {t('geniusHubs.learningCenter.description')}
            </p>
          </div>

          {/* Technology Lab */}
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl">🔬</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">{t('geniusHubs.technologyLab.title')}</h3>
            <p className="text-gray-600 text-center">
              {t('geniusHubs.technologyLab.description')}
            </p>
          </div>
        </div>

        {/* Global Network */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            {t('geniusHubs.globalStats.title')}
          </h3>
          <p className="text-gray-600 text-center mb-8 max-w-3xl mx-auto">
            {t('geniusHubs.globalStats.description')}
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">50+</div>
              <div className="text-gray-700">{t('geniusHubs.stats.locations')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">10K+</div>
              <div className="text-gray-700">{t('geniusHubs.stats.members')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">500+</div>
              <div className="text-gray-700">{t('geniusHubs.stats.projects')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
              <div className="text-gray-700">{t('geniusHubs.stats.support')}</div>
            </div>
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => scrollToSection('#contacts')}
              className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              {t('geniusHubs.joinNetwork')}
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-16 bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            {t('contact.quickActions')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-all duration-200 text-left">
              <h4 className="font-semibold text-gray-900 mb-2">{t('geniusHubs.quickActions.submitIdea')}</h4>
              <p className="text-gray-600 text-sm">{t('geniusHubs.quickActions.submitDescription')}</p>
            </button>
            <button className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-all duration-200 text-left">
              <h4 className="font-semibold text-gray-900 mb-2">{t('geniusHubs.quickActions.joinHub')}</h4>
              <p className="text-gray-600 text-sm">{t('geniusHubs.quickActions.joinDescription')}</p>
            </button>
            <button className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-all duration-200 text-left">
              <h4 className="font-semibold text-gray-900 mb-2">{t('geniusHubs.quickActions.investorInquiry')}</h4>
              <p className="text-gray-600 text-sm">{t('geniusHubs.quickActions.investorDescription')}</p>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
