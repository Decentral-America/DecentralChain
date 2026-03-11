/**
 * i18next Configuration
 * Multi-language support with 17 languages
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import all translation files
import de from './locales/de/translation.json';
import en from './locales/en/translation.json';
import es from './locales/es/translation.json';
import et_EE from './locales/et_EE/translation.json';
import fr from './locales/fr/translation.json';
import hi_IN from './locales/hi_IN/translation.json';
import id from './locales/id/translation.json';
import it from './locales/it/translation.json';
import ja from './locales/ja/translation.json';
import ko from './locales/ko/translation.json';
import nl_NL from './locales/nl_NL/translation.json';
import pl from './locales/pl/translation.json';
import pt_BR from './locales/pt_BR/translation.json';
import pt_PT from './locales/pt_PT/translation.json';
import ru from './locales/ru/translation.json';
import tr from './locales/tr/translation.json';
import zh_CN from './locales/zh_CN/translation.json';

/**
 * Language resources
 */
const resources = {
  de: { translation: de },
  en: { translation: en },
  es: { translation: es },
  et_EE: { translation: et_EE },
  fr: { translation: fr },
  hi_IN: { translation: hi_IN },
  id: { translation: id },
  it: { translation: it },
  ja: { translation: ja },
  ko: { translation: ko },
  nl_NL: { translation: nl_NL },
  pl: { translation: pl },
  pt_BR: { translation: pt_BR },
  pt_PT: { translation: pt_PT },
  ru: { translation: ru },
  tr: { translation: tr },
  zh_CN: { translation: zh_CN },
};

/**
 * Supported language codes
 */
export const SUPPORTED_LANGUAGES = [
  { code: 'de', name: 'Deutsch' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'et_EE', name: 'Eesti' },
  { code: 'fr', name: 'Français' },
  { code: 'hi_IN', name: 'हिन्दी' },
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'it', name: 'Italiano' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'nl_NL', name: 'Nederlands' },
  { code: 'pl', name: 'Polski' },
  { code: 'pt_BR', name: 'Português (Brasil)' },
  { code: 'pt_PT', name: 'Português (Portugal)' },
  { code: 'ru', name: 'Русский' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'zh_CN', name: '简体中文' },
];

/**
 * Get browser language or default to English
 */
function getDefaultLanguage(): string {
  // Try to get from localStorage
  const stored = localStorage.getItem('language');
  if (stored && resources[stored as keyof typeof resources]) {
    return stored;
  }

  // Try to get from browser
  const browserLang =
    navigator.language || (navigator as Navigator & { userLanguage?: string }).userLanguage;

  // Check for exact match
  if (browserLang && resources[browserLang as keyof typeof resources]) {
    return browserLang;
  }

  // Check for language code only (e.g., 'en' from 'en-US')
  const langCode = browserLang?.split('-')[0];
  if (langCode && resources[langCode as keyof typeof resources]) {
    return langCode;
  }

  // Default to English
  return 'en';
}

/**
 * Initialize i18next
 */
i18n
  .use(initReactI18next) // Passes i18n down to react-i18next
  .init({
    resources,
    lng: getDefaultLanguage(), // Language to use
    fallbackLng: 'en', // Fallback language
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    // Enable nested keys (e.g., 'app.ui.active')
    keySeparator: '.',
    // Namespace separator (not used, but set for clarity)
    nsSeparator: false,
    // Debug mode (disable in production)
    debug: false,
  });

export default i18n;
