import React from 'react';
import { useI18n } from '../i18n/Context';

export function ContactSection() {
  const { t } = useI18n();

  return (
    <section id="contacts" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            {t('contact.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('contact.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('contact.getInTouch')}</h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 text-xl">📧</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{t('contact.email')}</h4>
                    <a href="mailto:contact@diamondbridge.io" className="text-blue-600 hover:text-blue-700 transition-colors">
                      contact@diamondbridge.io
                    </a>
                    <p className="text-gray-600 text-sm mt-1">{t('contact.emailContact')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-xl">📱</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Telegram</h4>
                    <a href="https://t.me/diamondbridge" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 transition-colors">
                      @diamondbridge
                    </a>
                    <p className="text-gray-600 text-sm mt-1">{t('contact.telegramContact')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-600 text-xl">💻</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">GitHub</h4>
                    <a href="https://github.com/diamondbridge" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 transition-colors">
                      github.com/diamondbridge
                    </a>
                    <p className="text-gray-600 text-sm mt-1">{t('contact.githubContact')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4">{t('contact.quickActions')}</h4>
              <div className="space-y-3">
                <button className="w-full text-left p-3 bg-white rounded-lg hover:shadow-md transition-all duration-200 border border-gray-200">
                  <div className="font-medium text-gray-900">{t('geniusHubs.quickActions.submitIdea')}</div>
                  <div className="text-gray-600 text-sm">{t('geniusHubs.quickActions.submitDescription')}</div>
                </button>
                <button className="w-full text-left p-3 bg-white rounded-lg hover:shadow-md transition-all duration-200 border border-gray-200">
                  <div className="font-medium text-gray-900">{t('geniusHubs.quickActions.joinHub')}</div>
                  <div className="text-gray-600 text-sm">{t('geniusHubs.quickActions.joinDescription')}</div>
                </button>
                <button className="w-full text-left p-3 bg-white rounded-lg hover:shadow-md transition-all duration-200 border border-gray-200">
                  <div className="font-medium text-gray-900">{t('geniusHubs.quickActions.investorInquiry')}</div>
                  <div className="text-gray-600 text-sm">{t('geniusHubs.quickActions.investorDescription')}</div>
                </button>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-gray-50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('contact.sendMessage')}</h3>
            <form className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('contact.firstName')}
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('contact.firstNamePlaceholder') as string}
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('contact.lastName')}
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('contact.lastNamePlaceholder') as string}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('contact.email')}
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('contact.emailPlaceholder') as string}
                />
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('contact.subject')}
                </label>
                <select
                  id="subject"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{t('contact.selectTopic')}</option>
                  <option value="idea">{t('contact.submitIdea')}</option>
                  <option value="partnership">{t('contact.partnership')}</option>
                  <option value="investment">{t('contact.investment')}</option>
                  <option value="technical">{t('contact.technical')}</option>
                  <option value="other">{t('contact.other')}</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('contact.message')}
                </label>
                <textarea
                  id="message"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder={t('contact.messagePlaceholder') as string}
                ></textarea>
              </div>
              
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                {t('contact.sendButton')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}