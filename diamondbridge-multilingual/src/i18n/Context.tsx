// Context.tsx — Контекст для управления языками

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { translations } from './translations';

export type Language = keyof typeof translations;

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  availableLanguages: Language[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // Определяем язык браузера или используем русский по умолчанию
  const getInitialLanguage = (): Language => {
    const saved = localStorage.getItem('diamondbridge-language') as Language;
    if (saved && translations[saved]) return saved;

    const browserLang = navigator.language.split('-')[0] as Language;
    if (translations[browserLang]) return browserLang;

    return 'ru';
  };

  const [currentLanguage, setCurrentLanguage] = useState<Language>(getInitialLanguage);

  const setLanguage = (lang: Language) => {
    setCurrentLanguage(lang);
    localStorage.setItem('diamondbridge-language', lang);
  };

  // Безопасная функция для получения перевода
  const getNestedValue = (obj: any, path: string[]): any =>
    path.reduce((acc, part) => acc?.[part], obj);

  const t = (key: string): string => {
    const keys = key.split('.');
    const value = getNestedValue(translations[currentLanguage], keys);
    if (value) return value;

    const fallback = getNestedValue(translations.ru, keys);
    return fallback || key;
  };

  const availableLanguages: Language[] = ['ru', 'en', 'de', 'fr', 'es', 'it', 'ja', 'zh'];

  useEffect(() => {
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        t,
        availableLanguages,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageProvider;
