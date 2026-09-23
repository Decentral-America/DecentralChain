import { Buffer } from 'node:buffer';
import '@testing-library/jest-dom';

/**
 * `@solana/web3.js` reaches for a global `Buffer` while deriving program
 * addresses. jsdom has none, and the failure is opaque — `findProgramAddressSync`
 * reports "Unable to find a viable program address nonce", which reads like a
 * bad seed rather than a missing global. The browser build polyfills this in
 * `vite.config.ts`; tests need the same.
 */
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

// Mock browser APIs not available in jsdom
/**
 * Everything below configures a DOM. Files that opt into `@vitest-environment
 * node` — pure-crypto suites with no rendering in them — have no `window`, and
 * this setup file runs for them too. Skip rather than throw.
 */
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    value: (query: string) => ({
      addEventListener: () => {},
      addListener: () => {},
      dispatchEvent: () => false,
      matches: false,
      media: query,
      onchange: null,
      removeEventListener: () => {},
      removeListener: () => {},
    }),
    writable: true,
  });

  // Mock IntersectionObserver
  class MockIntersectionObserver {
    readonly root = null;
    readonly rootMargin = '';
    readonly thresholds: number[] = [];
    observe = () => {};
    unobserve = () => {};
    disconnect = () => {};
    takeRecords = (): IntersectionObserverEntry[] => [];
  }
  window.IntersectionObserver = MockIntersectionObserver as typeof IntersectionObserver;

  // Mock ResizeObserver
  class MockResizeObserver {
    observe = () => {};
    unobserve = () => {};
    disconnect = () => {};
  }
  window.ResizeObserver = MockResizeObserver as typeof ResizeObserver;

  // Mock crypto.subtle for test environment
  if (!window.crypto?.subtle) {
    Object.defineProperty(window, 'crypto', {
      value: {
        getRandomValues: <T extends ArrayBufferView>(array: T): T => {
          const bytes = array as Uint8Array;
          for (let i = 0; i < bytes.length; i++) {
            bytes[i] = Math.floor(Math.random() * 256);
          }
          return array;
        },
        randomUUID: () => '00000000-0000-4000-8000-000000000000',
        subtle: {
          decrypt: async () => new TextEncoder().encode('{}').buffer,
          deriveKey: async () => ({}) as CryptoKey,
          encrypt: async () => new ArrayBuffer(32),
          importKey: async () => ({}) as CryptoKey,
        },
      },
    });
  }

  // Node 25 exposes a built-in Web Storage `localStorage` global. Started without
  // a valid `--localstorage-file` path it is present but inert — `clear`,
  // `getItem` and `setItem` are all undefined. In vitest's jsdom environment
  // `window === globalThis`, so that inert global occupies the slot jsdom would
  // otherwise fill and every suite touching storage fails with
  // "localStorage.clear is not a function".
  //
  // The repo pins Node 24 via .node-version, where no such global exists, so CI
  // never sees this — but a developer on a newer Node hits 30 failures with no
  // obvious cause. Installing a minimal in-memory Storage keeps the suite correct
  // and deterministic on either version.
  class MemoryStorage implements Storage {
    #entries = new Map<string, string>();

    get length(): number {
      return this.#entries.size;
    }

    clear(): void {
      this.#entries.clear();
    }

    getItem(key: string): string | null {
      return this.#entries.get(String(key)) ?? null;
    }

    key(index: number): string | null {
      return [...this.#entries.keys()][index] ?? null;
    }

    removeItem(key: string): void {
      this.#entries.delete(String(key));
    }

    setItem(key: string, value: string): void {
      this.#entries.set(String(key), String(value));
    }
  }

  for (const name of ['localStorage', 'sessionStorage'] as const) {
    if (
      typeof (globalThis as Record<string, unknown> & { [k: string]: Storage })[name]?.clear !==
      'function'
    ) {
      Object.defineProperty(globalThis, name, {
        configurable: true,
        value: new MemoryStorage(),
        writable: true,
      });
    }
  }
}
