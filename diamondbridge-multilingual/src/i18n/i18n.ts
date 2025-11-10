import { translations } from './translations';

export type Language = keyof typeof translations;

export const getTranslation = (lang: Language, key: string): string => {
  const getNestedValue = (obj: any, path: string[]): any =>
    path.reduce((acc, part) => acc?.[part], obj);

  const keys = key.split('.');
  const value = getNestedValue(translations[lang], keys);
  return value || getNestedValue(translations.ru, keys) || key;
};
