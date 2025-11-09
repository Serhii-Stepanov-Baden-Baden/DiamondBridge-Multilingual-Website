// LanguageSwitcher.tsx - Переключатель языков с флагами

import React from 'react';
import { useLanguage } from '../i18n/Context';

interface LanguageFlag {
  code: string;
  name: string;
  flag: string;
  nativeName: string;
}

const languages: LanguageFlag[] = [
  { code: 'ru', name: 'Русский', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'de', name: 'Deutsch', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italiano', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'ja', name: '日本語', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: '中文', nativeName: '中文', flag: '🇨🇳' }
];

const LanguageSwitcher: React.FC = () => {
  const { currentLanguage, setLanguage } = useLanguage();

  return (
    <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-md rounded-lg p-2 shadow-lg border border-white/20">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code as any)}
          className={`
            flex items-center space-x-1 px-2 py-1 rounded-md text-sm font-medium
            transition-all duration-200 hover:scale-105 hover:shadow-md
            ${currentLanguage === lang.code
              ? 'bg-blue-500 text-white shadow-lg border-2 border-blue-400'
              : 'bg-white/60 text-gray-700 hover:bg-white/80 border-2 border-transparent hover:border-gray-300'
            }
          `}
          title={`Переключить на ${lang.name}`}
        >
          <span className="text-lg">{lang.flag}</span>
          <span className="hidden sm:inline">{lang.nativeName}</span>
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
