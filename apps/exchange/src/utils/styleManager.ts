import { logger } from '@/lib/logger';
/**
 * Style Manager Utility
 * Dynamic CSS theme and style management for React applications
 */

/**
 * Theme type
 */
export type ThemeType = 'dark' | 'light' | 'custom';

/**
 * CSS style object
 */
export type CSSStyleObject = Record<string, string | number>;

/**
 * Theme configuration
 */
export interface ThemeConfig {
  /**
   * Theme name
   */
  name: string;

  /**
   * CSS custom properties
   */
  properties: Record<string, string>;

  /**
   * Additional CSS rules
   */
  css?: string;
}

/**
 * Style entry
 */
interface StyleEntry {
  /**
   * Style ID
   */
  id: string;

  /**
   * Style element
   */
  element: HTMLStyleElement;

  /**
   * CSS content
   */
  content: string;

  /**
   * Creation timestamp
   */
  timestamp: number;
}

/**
 * Style Manager class for dynamic CSS management
 */
class StyleManagerClass {
  /**
   * Registered styles
   */
  private styles: Map<string, StyleEntry> = new Map();

  /**
   * Registered themes
   */
  private themes: Map<string, ThemeConfig> = new Map();

  /**
   * Current theme
   */
  private currentTheme: string = 'dark';

  /**
   * Root element for style scoping
   */
  private root: HTMLElement = document.documentElement;

  /**
   * Style counter for unique IDs
   */
  private styleCounter: number = 0;

  constructor() {
    // Initialize with stored theme
    const stored = this.getStoredTheme();
    if (stored) {
      this.currentTheme = stored;
      this.applyTheme(stored);
    }
  }

  /**
   * Apply theme to document
   * @param theme - Theme name
   */
  applyTheme(theme: string = 'dark'): void {
    // Update current theme
    this.currentTheme = theme;

    // Set data attribute
    this.root.setAttribute('data-theme', theme);

    // Apply theme config if registered
    const config = this.themes.get(theme);
    if (config) {
      // Apply custom properties
      Object.entries(config.properties).forEach(([property, value]) => {
        this.setCustomProperty(property, value);
      });

      // Inject additional CSS
      if (config.css) {
        this.injectCSS(config.css, `theme-${theme}`);
      }
    }

    // Store theme preference
    localStorage.setItem('theme', theme);

    logger.debug(`Theme applied: ${theme}`);
  }

  /**
   * Get current theme
   * @returns Theme name
   */
  getTheme(): string {
    return this.currentTheme;
  }

  /**
   * Get stored theme from localStorage
   * @returns Stored theme or default
   */
  getStoredTheme(): string {
    return localStorage.getItem('theme') || 'dark';
  }

  /**
   * Toggle between dark and light themes
   */
  toggleTheme(): void {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme);
  }

  /**
   * Register theme configuration
   * @param config - Theme config
   */
  registerTheme(config: ThemeConfig): void {
    this.themes.set(config.name, config);
    logger.debug(`Theme registered: ${config.name}`);
  }

  /**
   * Unregister theme
   * @param name - Theme name
   */
  unregisterTheme(name: string): void {
    this.themes.delete(name);
    logger.debug(`Theme unregistered: ${name}`);
  }

  /**
   * Get all registered themes
   * @returns Array of theme names
   */
  getThemes(): string[] {
    return Array.from(this.themes.keys());
  }

  /**
   * Inject CSS into document
   * @param css - CSS content
   * @param id - Style ID (auto-generated if not provided)
   * @returns Style ID
   */
  injectCSS(css: string, id?: string): string {
    // Generate ID if not provided
    // biome-ignore lint/nursery/useNullishCoalescing: empty string id is invalid — generate a new one
    const styleId = id || `style-${++this.styleCounter}`;

    // Remove existing style with same ID
    this.removeCSS(styleId);

    // Create style element
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = css;
    document.head.appendChild(style);

    // Store entry
    this.styles.set(styleId, {
      content: css,
      element: style,
      id: styleId,
      timestamp: Date.now(),
    });

    logger.debug(`CSS injected: ${styleId}`);
    return styleId;
  }

  /**
   * Remove CSS from document
   * @param id - Style ID
   * @returns Success status
   */
  removeCSS(id: string): boolean {
    const entry = this.styles.get(id);
    if (entry) {
      document.head.removeChild(entry.element);
      this.styles.delete(id);
      logger.debug(`CSS removed: ${id}`);
      return true;
    }
    return false;
  }

  /**
   * Update existing CSS
   * @param id - Style ID
   * @param css - New CSS content
   * @returns Success status
   */
  updateCSS(id: string, css: string): boolean {
    const entry = this.styles.get(id);
    if (entry) {
      entry.element.textContent = css;
      entry.content = css;
      logger.debug(`CSS updated: ${id}`);
      return true;
    }
    return false;
  }

  /**
   * Get CSS content
   * @param id - Style ID
   * @returns CSS content or null
   */
  getCSS(id: string): string | null {
    const entry = this.styles.get(id);
    return entry ? entry.content : null;
  }

  /**
   * Check if CSS exists
   * @param id - Style ID
   * @returns True if exists
   */
  hasCSS(id: string): boolean {
    return this.styles.has(id);
  }

  /**
   * Add scoped style rule
   * @param path - CSS selector path
   * @param style - Style object or CSS string
   * @param root - Root selector (default: .app)
   * @returns Style ID
   */
  addScopedStyle(path: string, style: CSSStyleObject | string, root: string = '.app'): string {
    const styleString = typeof style === 'string' ? style : this.styleObjectToCSS(style);
    const css = `${root} ${path} { ${styleString} }`;
    return this.injectCSS(css, `scoped-${path.replace(/[^\w-]/g, '-')}`);
  }

  /**
   * Set CSS custom property (CSS variable)
   * @param property - Property name (with or without --)
   * @param value - Property value
   */
  setCustomProperty(property: string, value: string): void {
    // Ensure property starts with --
    const prop = property.startsWith('--') ? property : `--${property}`;
    this.root.style.setProperty(prop, value);
  }

  /**
   * Get CSS custom property value
   * @param property - Property name (with or without --)
   * @returns Property value
   */
  getCustomProperty(property: string): string {
    // Ensure property starts with --
    const prop = property.startsWith('--') ? property : `--${property}`;
    return getComputedStyle(this.root).getPropertyValue(prop).trim();
  }

  /**
   * Remove CSS custom property
   * @param property - Property name (with or without --)
   */
  removeCustomProperty(property: string): void {
    // Ensure property starts with --
    const prop = property.startsWith('--') ? property : `--${property}`;
    this.root.style.removeProperty(prop);
  }

  /**
   * Set multiple custom properties at once
   * @param properties - Object of property name-value pairs
   */
  setCustomProperties(properties: Record<string, string>): void {
    Object.entries(properties).forEach(([property, value]) => {
      this.setCustomProperty(property, value);
    });
  }

  /**
   * Convert style object to CSS string
   * @param style - Style object
   * @returns CSS string
   */
  styleObjectToCSS(style: CSSStyleObject): string {
    return Object.entries(style)
      .map(([key, value]) => {
        // Convert camelCase to kebab-case
        const cssKey = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
        return `${cssKey}: ${value}`;
      })
      .join('; ');
  }

  /**
   * Parse CSS string to style object
   * @param css - CSS string
   * @returns Style object
   */
  parseCSSToObject(css: string): CSSStyleObject {
    const style: CSSStyleObject = {};
    css.split(';').forEach((declaration) => {
      const [key, value] = declaration.split(':').map((s) => s.trim());
      if (key && value) {
        // Convert kebab-case to camelCase
        const jsKey = key.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
        style[jsKey] = value;
      }
    });
    return style;
  }

  /**
   * Get all injected styles
   * @returns Array of style entries
   */
  getAllStyles(): StyleEntry[] {
    return Array.from(this.styles.values());
  }

  /**
   * Clear all injected styles
   */
  clearAllStyles(): void {
    this.styles.forEach((entry) => {
      document.head.removeChild(entry.element);
    });
    this.styles.clear();
    logger.debug('All styles cleared');
  }

  /**
   * Add global CSS class to root element
   * @param className - Class name
   */
  addClass(className: string): void {
    this.root.classList.add(className);
  }

  /**
   * Remove global CSS class from root element
   * @param className - Class name
   */
  removeClass(className: string): void {
    this.root.classList.remove(className);
  }

  /**
   * Toggle global CSS class on root element
   * @param className - Class name
   */
  toggleClass(className: string): void {
    this.root.classList.toggle(className);
  }

  /**
   * Check if root element has class
   * @param className - Class name
   * @returns True if has class
   */
  hasClass(className: string): boolean {
    return this.root.classList.contains(className);
  }

  /**
   * Perform style transaction (temporarily remove, execute callback, re-add)
   * @param id - Style ID
   * @param callback - Callback to execute
   */
  async styleTransaction(id: string, callback: () => void | Promise<void>): Promise<void> {
    const entry = this.styles.get(id);
    if (entry) {
      // Temporarily remove style
      document.head.removeChild(entry.element);

      try {
        // Execute callback
        await callback();
      } finally {
        // Re-add style
        document.head.appendChild(entry.element);
      }
    } else {
      // Style doesn't exist, just execute callback
      await callback();
    }
  }

  /**
   * Get statistics
   * @returns Style manager statistics
   */
  getStats(): {
    totalStyles: number;
    totalThemes: number;
    currentTheme: string;
    customProperties: number;
  } {
    // Count custom properties
    const computedStyles = getComputedStyle(this.root);
    let customPropsCount = 0;
    for (let i = 0; i < computedStyles.length; i++) {
      const propName = computedStyles[i];
      if (propName?.startsWith('--')) {
        customPropsCount++;
      }
    }

    return {
      currentTheme: this.currentTheme,
      customProperties: customPropsCount,
      totalStyles: this.styles.size,
      totalThemes: this.themes.size,
    };
  }

  /**
   * Destroy style manager (cleanup)
   */
  destroy(): void {
    this.clearAllStyles();
    this.themes.clear();
    logger.debug('StyleManager destroyed');
  }
}

/**
 * Global style manager instance
 */
export const styleManager = new StyleManagerClass();

/**
 * Export class for custom instances
 */
export { StyleManagerClass };
