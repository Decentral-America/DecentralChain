// from webpack.DefinePlugin
declare const __AMPLITUDE_API_KEY__: string | undefined;
declare const __MIXPANEL_TOKEN__: string | undefined;
declare const __SENTRY_DSN__: string | undefined;
declare const __SENTRY_ENVIRONMENT__: string | undefined;
declare const __SENTRY_RELEASE__: string | undefined;

declare module '*.module.css' {
  const styles: Record<string, string>;
  export = styles;
}

declare module '*.styl' {
  const styles: Record<string, string>;
  export = styles;
}

declare module '*.svg' {
  const url: string;
  export = url;
}

// Type shims for prismjs sub-path imports.
// babel-plugin-prismjs was removed; @types/prismjs does not cover component-level
// sub-paths (prismjs/components/*). We declare just enough to type-check highlight.tsx.
declare module 'prismjs/components/prism-core' {
  interface Grammar {
    [key: string]: unknown;
  }
  interface PrismStatic {
    languages: Record<string, Grammar>;
    highlight(text: string, grammar: Grammar, language: string): string;
  }
  const Prism: PrismStatic;
  export default Prism;
}

// prismjs language component modules register themselves as side-effects on import.
declare module 'prismjs/components/prism-json' {}
