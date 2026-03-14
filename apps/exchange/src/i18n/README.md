# Internationalization (i18n)

This directory contains the internationalization configuration for the DCC React wallet.

## Setup

The project uses [i18next](https://www.i18next.com/) and [react-i18next](https://react.i18next.com/) for multilingual support.

### Supported Languages (17)

- 🇩🇪 German (`de`)
- 🇬🇧 English (`en`) - Default
- 🇪🇸 Spanish (`es`)
- 🇪🇪 Estonian (`et_EE`)
- 🇫🇷 French (`fr`)
- 🇮🇳 Hindi (`hi_IN`)
- 🇮🇩 Indonesian (`id`)
- 🇮🇹 Italian (`it`)
- 🇯🇵 Japanese (`ja`)
- 🇰🇷 Korean (`ko`)
- 🇳🇱 Dutch (`nl_NL`)
- 🇵🇱 Polish (`pl`)
- 🇧🇷 Brazilian Portuguese (`pt_BR`)
- 🇵🇹 European Portuguese (`pt_PT`)
- 🇷🇺 Russian (`ru`)
- 🇹🇷 Turkish (`tr`)
- 🇨🇳 Simplified Chinese (`zh_CN`)

## Directory Structure

```
src/i18n/
├── index.ts              # i18next configuration
├── i18n.ts               # Barrel exports
├── README.md             # This file
└── locales/              # Translation files (auto-generated)
    ├── de/
    │   └── translation.json
    ├── en/
    │   └── translation.json
    └── ...
```

## Usage in Components

### Basic Usage

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('app.ui.welcome')}</h1>
      <p>{t('app.ui.description')}</p>
    </div>
  );
}
```

### With Parameters

```tsx
const { t } = useTranslation();

// Translation key: "Welcome, {{name}}!"
return <p>{t('greeting', { name: 'John' })}</p>;
```

### Changing Language

```tsx
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '@/i18n';

function LanguageSelector() {
  const { i18n } = useTranslation();

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('language', langCode);
  };

  return (
    <select value={i18n.language} onChange={(e) => changeLanguage(e.target.value)}>
      {SUPPORTED_LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  );
}
```

## Translation Files

### Source Files

Original Angular translation files are located in `/locale/` at the project root:

```
locale/
├── de/
│   ├── app.ui.json
│   ├── app.dex.json
│   └── ...
├── en/
└── ...
```

### Merging Translation Files

Translation files are merged using the `mergeLocales.js` script:

```bash
npm run merge-locales
```

This script:
1. Reads all JSON files from each language directory in `/locale/`
2. Merges them into a single `translation.json` per language
3. Outputs to `src/i18n/locales/{language}/translation.json`

### Translation Key Structure

Keys follow the original Angular file structure:

```
app.ui.active          → from locale/en/app.ui.json
app.dex.orderBook      → from locale/en/app.dex.json
app.wallet.balance     → from locale/en/app.wallet.json
```

## Configuration

### Default Language

The default language is determined by:

1. **localStorage**: Checks for `language` key
2. **Browser Language**: Uses `navigator.language`
3. **Fallback**: English (`en`)

### i18next Options

```typescript
{
  resources,                // All language translations
  lng: getDefaultLanguage(), // Current language
  fallbackLng: 'en',        // Fallback language
  interpolation: {
    escapeValue: false,     // React already escapes
  },
  keySeparator: '.',        // Enable nested keys
  nsSeparator: false,       // No namespace separator
  debug: false,             // Disable debug mode
}
```

## Development

### Adding New Translations

1. Add/edit JSON files in `/locale/{language}/`
2. Run `npm run merge-locales`
3. Translation will be available via `t('your.new.key')`

### Type Safety

For better TypeScript support, you can extend the translation types:

```typescript
// i18next.d.ts
import 'react-i18next';
import en from './locales/en/translation.json';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    resources: {
      translation: typeof en;
    };
  }
}
```

## Performance Considerations

⚠️ **Bundle Size**: All translations (~2.6 MB) are currently bundled. Future optimizations:

- Lazy loading translations per route
- Code splitting by language
- Dynamic imports for rarely-used languages

## Maintenance

- **Source of Truth**: Original files in `/locale/` (shared with Angular app)
- **Build Artifact**: Merged files in `src/i18n/locales/`
- **Migration**: Run `npm run merge-locales` when updating translations

## Resources

- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Documentation](https://react.i18next.com/)
- [Migration Guide](https://react.i18next.com/latest/migrating-from-old-react-i18next)
