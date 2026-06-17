import { createContext, useContext, useEffect, useState } from 'react';
import { logWarn } from '@/lib/error-logger';
import { type Language, type LanguageContextValue } from '@/types';
import { translations } from '../utils/translations';

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider = ({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement => {
  // Always start with 'en' on the server. Reading localStorage in the
  // useState initializer causes React #418: the server renders English but
  // the client hydrates in Spanish (or vice versa), mismatching every
  // translated string. The useEffect below syncs to the stored preference
  // after hydration — same pattern as ClientTimeAgo / ClientNumber.
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('language');
      if (stored === 'es') setLanguage('es');
    } catch (error) {
      logWarn('localStorage not available', { error });
    }
  }, []);

  const changeLanguage = (lang: Language): void => {
    setLanguage(lang);
    // Safe localStorage access
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('language', lang);
      } catch (error) {
        logWarn('localStorage not available', { error });
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
