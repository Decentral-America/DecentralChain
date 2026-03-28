import '@testing-library/jest-dom';

// Mock browser APIs not available in jsdom
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
