import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { translations } from './translations';
import { getTranslation, Language } from './i18n';

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

  const t = (key: string): string => getTranslation(currentLanguage, key);

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
