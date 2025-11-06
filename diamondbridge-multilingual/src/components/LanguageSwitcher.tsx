import React from 'react';
import { useI18n } from '../i18n/Context';
import { Language } from '../i18n/translations';

const languages = [
  { code: 'en' as Language, name: 'English', flag: '🇺🇸' },
  { code: 'de' as Language, name: 'Deutsch', flag: '🇩🇪' },
  { code: 'ru' as Language, name: 'Русский', flag: '🇷🇺' },
];

export function LanguageSwitcher() {
  const { language, setLanguage } = useI18n();

  return (
    <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg p-1">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={`
            flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-all duration-200
            ${language === lang.code
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-700 hover:bg-white/20 hover:text-blue-600'
            }
          `}
          title={lang.name}
        >
          <span className="text-base">{lang.flag}</span>
          <span className="hidden sm:inline">{lang.code.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
}