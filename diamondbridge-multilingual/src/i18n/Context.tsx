// Context.tsx - Контекст для управления языками

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language } from './translations';

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
    if (saved && translations[saved]) {
      return saved;
    }
    
    // Автоопределение языка браузера
    const browserLang = navigator.language.split('-')[0] as Language;
    if (translations[browserLang]) {
      return browserLang;
    }
    
    return 'ru'; // По умолчанию русский
  };

  const [currentLanguage, setCurrentLanguage] = useState<Language>(getInitialLanguage);

  // Сохраняем выбор в localStorage
  const setLanguage = (lang: Language) => {
    setCurrentLanguage(lang);
    localStorage.setItem('diamondbridge-language', lang);
  };

  // Функция для получения перевода
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[currentLanguage];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || translations.ru[key as keyof typeof translations.ru] || key;
  };

  // Список доступных языков
  const availableLanguages: Language[] = ['ru', 'en', 'de', 'fr', 'es', 'it', 'ja', 'zh'];

  useEffect(() => {
    // Обновляем атрибут lang в HTML при смене языка
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  return (
    <LanguageContext.Provider value={{ 
      currentLanguage, 
      setLanguage, 
      t, 
      availableLanguages 
    }}>
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
