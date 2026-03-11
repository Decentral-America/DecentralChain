/**
 * useTranslation Hook Wrapper
 * Custom hook around react-i18next providing type-safe translation
 * with localStorage persistence and enhanced language management
 */
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '@/i18n';
import { logger } from '@/lib/logger';

/**
 * Translation function parameters
 */
export interface TranslationParams {
  [key: string]: string | number | boolean;
}

/**
 * useTranslation Hook
 * Wrapper around react-i18next with additional utilities
 */
export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();

  /**
   * Translate a key with optional parameters
   * @param key - Translation key (e.g., 'app.ui.welcome')
   * @param params - Optional parameters for interpolation
   * @returns Translated string
   */
  const translate = (key: string, params?: TranslationParams): string => {
    return params ? t(key, params) : t(key);
  };

  /**
   * Change the current language
   * Persists to localStorage for next session
   * @param lang - Language code (e.g., 'en', 'es')
   */
  const changeLanguage = async (lang: string): Promise<void> => {
    try {
      await i18n.changeLanguage(lang);
      localStorage.setItem('language', lang);
    } catch (error) {
      logger.error('Failed to change language:', error);
    }
  };

  /**
   * Get current language code
   */
  const currentLanguage = i18n.language;

  /**
   * Get current language display name
   */
  const currentLanguageName =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage)?.name || currentLanguage;

  /**
   * Get all available languages
   */
  const availableLanguages = SUPPORTED_LANGUAGES;

  /**
   * Check if a language is supported
   * @param lang - Language code to check
   * @returns true if language is supported
   */
  const isLanguageSupported = (lang: string): boolean => {
    return SUPPORTED_LANGUAGES.some((l) => l.code === lang);
  };

  /**
   * Get language from code
   * @param code - Language code
   * @returns Language object or undefined
   */
  const getLanguageByCode = (code: string) => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === code);
  };

  return {
    // Translation function
    t: translate,

    // Language management
    currentLanguage,
    currentLanguageName,
    changeLanguage,
    availableLanguages,
    isLanguageSupported,
    getLanguageByCode,

    // Raw i18n instance (for advanced usage)
    i18n,
  };
};

/**
 * Export type for external use
 */
export type UseTranslationReturn = ReturnType<typeof useTranslation>;
