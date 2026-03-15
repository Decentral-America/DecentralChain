import { createContext, useContext, useState } from 'react';
import { type Language, type LanguageContextValue } from '@/types';
import { translations } from '../utils/translations';

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider = ({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement => {
  const [language, setLanguage] = useState<Language>(() => {
    // Safe localStorage access - only on client side
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('language');
        return stored === 'es' ? 'es' : 'en';
      } catch (error) {
        console.warn('localStorage not available:', error);
        return 'en';
      }
    }
    return 'en';
  });

  const changeLanguage = (lang: Language): void => {
    setLanguage(lang);
    // Safe localStorage access
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('language', lang);
      } catch (error) {
        console.warn('localStorage not available:', error);
      }
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const message = translations[language]?.[key] || key;
    if (!params) return message;

    return Object.entries(params).reduce((acc, [paramKey, value]) => {
      return acc.replaceAll(`{${paramKey}}`, String(value));
    }, message);
  };

  return (
    <LanguageContext.Provider value={{ changeLanguage, language, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextValue => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
