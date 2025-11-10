import React from 'react';
import { useLanguage } from '../i18n/Context';
import LanguageSwitcher from './LanguageSwitcher';

export function Navigation() {
const { t } = useLanguage();

  const navItems = [
    { key: 'home', href: '#home' },
    { key: 'problem', href: '#problem' },
    { key: 'solution', href: '#solution' },
    { key: 'mechanics', href: '#mechanics' },
    { key: 'geniusHubs', href: '#genius-hubs' },
    { key: 'aiChat', href: '#ai-chat' },
    { key: 'mediaTools', href: '#media-tools' },
    { key: 'drive', href: '#drive' },
    { key: 'dashboard', href: '#dashboard' },
    { key: 'about', href: '#about' },
    { key: 'contacts', href: '#contacts' },
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={() => scrollToSection('#home')}
              className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              DiamondBridge
            </button>
          </div>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center space-x-6">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => scrollToSection(item.href)}
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium text-sm"
              >
                {t(`nav.${item.key}`)}
              </button>
            ))}
          </div>

          {/* Mobile Navigation Menu */}
          <div className="lg:hidden">
            <select
              onChange={(e) => scrollToSection(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select section</option>
              {navItems.map((item) => (
                <option key={item.key} value={item.href}>
                  {t(`nav.${item.key}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Language Switcher and Contact */}
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            
            {/* Contact Button */}
            <button
              onClick={() => scrollToSection('#contacts')}
              className="hidden sm:block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {t('nav.contactUs')}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
