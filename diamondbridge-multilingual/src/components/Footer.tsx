import React from 'react';
import { useLanguage } from '../i18n/Context';

export function Footer() {
  const { t } = useLanguage();

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navigationLinks = t('footer.navigation.links') as string[];
  const projectLinks = t('footer.project.links') as string[];

  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Description */}
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold text-blue-400 mb-4">DiamondBridge</h3>
            <p className="text-gray-300 leading-relaxed">
              {t('footer.brandDescription')}
            </p>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">{t('footer.navigation.title')}</h4>
            <ul className="space-y-2">
              {navigationLinks.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => scrollToSection(`#${['home', 'problem', 'solution', 'mechanics'][index]}`)}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {link}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Project Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">{t('footer.project.title')}</h4>
            <ul className="space-y-2">
              {projectLinks.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => scrollToSection(`#${['genius-hubs', 'about', 'contacts'][index]}`)}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {link}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Channels */}
        <div className="border-t border-gray-700 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h5 className="text-lg font-semibold mb-2">{t('footer.contactChannels.title')}</h5>
              <div className="flex space-x-6">
                <a href="mailto:contact@diamondbridge.io" className="text-gray-300 hover:text-white transition-colors flex items-center space-x-2">
                  <span>📧</span>
                  <span>{t('footer.contactChannels.email')}</span>
                </a>
                <a href="https://t.me/diamondbridge" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors flex items-center space-x-2">
                  <span>📱</span>
                  <span>{t('footer.contactChannels.telegram')}</span>
                </a>
                <a href="https://github.com/diamondbridge" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors flex items-center space-x-2">
                  <span>💻</span>
                  <span>{t('footer.contactChannels.github')}</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <div className="space-y-2">
            <p>{t('footer.copyright')}</p>
            <p className="text-sm">{t('footer.version')}</p>
            <p className="text-sm">{t('footer.createdBy')}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
