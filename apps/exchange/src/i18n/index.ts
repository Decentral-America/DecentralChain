/**
 * i18next Configuration
 * Multi-language support with 17 languages
 *
 * Locales are served from /public/locales/ via i18next-http-backend v4.
 * NO static JSON imports — translations are fetched at runtime for the
 * user's language only, removing ~2.2 MB / 640 kB gz from the initial bundle.
 * React.Suspense in main.tsx gates rendering until the first locale loads.
 *
 * i18next-http-backend v4 (2025): requires native fetch — available in all
 * modern browsers, Node ≥ 18, Deno, Bun. Dropped cross-fetch polyfill.
 */
import i18n from 'i18next';
import Backend, { type HttpBackendOptions } from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

// App version is injected by vite.config.ts define block as VITE_APP_VERSION.
// Used as a cache-buster query param on locale fetch URLs (public/ files are
// NOT content-hashed by Vite, so stale translations survive deploys without this).
const APP_VERSION = (import.meta.env.VITE_APP_VERSION as string | undefined) ?? '0.0.0';

const SUPPORTED_CODES = [
  'de',
  'en',
  'es',
  'et_EE',
  'fr',
  'hi_IN',
  'id',
  'it',
  'ja',
  'ko',
  'nl_NL',
  'pl',
  'pt_BR',
  'pt_PT',
  'ru',
  'tr',
  'zh_CN',
] as const;

/**
 * Supported language codes and display names.
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
] as const;

type SupportedCode = (typeof SUPPORTED_CODES)[number];

function isSupportedCode(code: string): code is SupportedCode {
  return (SUPPORTED_CODES as readonly string[]).includes(code);
}

/**
 * Normalise a BCP-47 language tag to our underscore-separated locale format.
 * navigator.language uses hyphens (e.g. 'et-EE', 'zh-CN').
 * Our locale file paths use underscores (e.g. 'et_EE', 'zh_CN').
 * Only the first hyphen is replaced — subtag separator, not part of the code.
 */
function normalizeCode(code: string): string {
  return code.replace('-', '_');
}

/**
 * Resolve the user's preferred language, validated against our supported list.
 * Priority: localStorage → navigator.language (normalised) → language-only fallback → 'en'.
 */
function getDefaultLanguage(): string {
  const stored = localStorage.getItem('language');
  if (stored && isSupportedCode(stored)) return stored;

  const nav = navigator as Navigator & { userLanguage?: string };
  const browserLang = navigator.language || nav.userLanguage;

  if (browserLang) {
    const normalized = normalizeCode(browserLang);
    if (isSupportedCode(normalized)) return normalized;

    // Language-only part: 'en' from 'en-US', 'de' from 'de-AT', etc.
    const langOnly = browserLang.split('-')[0] ?? '';
    if (isSupportedCode(langOnly)) return langOnly;
  }

  return 'en';
}

/**
 * Initialize i18next with HTTP backend.
 *
 * Key options:
 *   load: 'currentOnly' — load ONLY the resolved language code; prevents i18next
 *     from requesting regional variants that would 404 (e.g. 'et' when we have 'et_EE').
 *   queryStringParams.v — app version cache-buster for public/locales/ files.
 *   react.useSuspense — React.Suspense gates rendering until the first locale loads.
 */
void i18n
  .use(Backend)
  .use(initReactI18next)
  .init<HttpBackendOptions>({
    backend: {
      // Vite dev server and production static hosting both serve files from public/ at root.
      loadPath: '/locales/{{lng}}/translation.json',
      // Append app version so each release invalidates cached translation files.
      queryStringParams: { v: APP_VERSION },
    },
    debug: false,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    keySeparator: '.',
    lng: getDefaultLanguage(),
    load: 'currentOnly',
    nsSeparator: false,
    react: {
      useSuspense: true,
    },
  })
  .catch((err: unknown) => {
    // Surface init failures in development. In production the ErrorBoundary catches
    // any downstream rendering errors; the i18n instance falls back to 'en' keys.
    if (import.meta.env.DEV) {
      console.error('[i18n] Initialization failed:', err);
    }
  });

export default i18n;
