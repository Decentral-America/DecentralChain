import { afterEach, describe, expect, it, vi } from 'vitest';

async function load() {
  vi.resetModules();
  return import('../cubensis');
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Cubensis Connect gate', () => {
  it('is off while no store listing URL is configured', async () => {
    vi.stubEnv('VITE_CUBENSIS_ENABLED', 'true');
    vi.stubEnv('VITE_CUBENSIS_INSTALL_URL', '');
    const { CUBENSIS_ENABLED, CUBENSIS_INSTALL_URL } = await load();
    expect(CUBENSIS_ENABLED).toBe(false);
    expect(CUBENSIS_INSTALL_URL).toBe('');
  });

  it('is off unless explicitly enabled, even with a listing', async () => {
    vi.stubEnv('VITE_CUBENSIS_ENABLED', 'false');
    vi.stubEnv('VITE_CUBENSIS_INSTALL_URL', 'https://chromewebstore.google.com/detail/x/abc');
    expect((await load()).CUBENSIS_ENABLED).toBe(false);
  });

  it('turns on with the flag and an https listing', async () => {
    vi.stubEnv('VITE_CUBENSIS_ENABLED', 'true');
    vi.stubEnv('VITE_CUBENSIS_INSTALL_URL', 'https://chromewebstore.google.com/detail/x/abc');
    const { CUBENSIS_ENABLED, CUBENSIS_INSTALL_URL } = await load();
    expect(CUBENSIS_ENABLED).toBe(true);
    expect(CUBENSIS_INSTALL_URL).toBe('https://chromewebstore.google.com/detail/x/abc');
  });
});
