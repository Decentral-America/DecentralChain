import resolve from '../../src/tools/resolve';

describe('resolve – SSRF prevention & protocol enforcement', () => {
  it('resolves relative paths correctly', () => {
    const result = resolve('/blocks/height', 'https://nodes.example.com');
    expect(result).toBe('https://nodes.example.com/blocks/height');
  });

  it('prevents absolute URLs from overriding the base host (SSRF)', () => {
    // An attacker could craft a path like "https://evil.com/steal"
    // After stripping the protocol, the path becomes "evil.com/steal" — a path segment, not a host
    const result = resolve('https://evil.com/steal', 'https://nodes.example.com');
    const url = new URL(result);
    expect(url.hostname).toBe('nodes.example.com');
  });

  it('prevents protocol-relative URLs from overriding the base host', () => {
    const result = resolve('//evil.com/steal', 'https://nodes.example.com');
    const url = new URL(result);
    expect(url.hostname).toBe('nodes.example.com');
  });

  it('rejects HTTP for remote hosts', () => {
    expect(() => resolve('/blocks/height', 'http://remote-node.com')).toThrow(/Insecure protocol/);
  });

  it('allows HTTP for localhost (development)', () => {
    const result = resolve('/blocks/height', 'http://localhost:6869');
    expect(result).toBe('http://localhost:6869/blocks/height');
  });

  it('allows HTTP for 127.0.0.1 (development)', () => {
    const result = resolve('/blocks/height', 'http://127.0.0.1:6869');
    expect(result).toBe('http://127.0.0.1:6869/blocks/height');
  });

  it('allows HTTPS for remote hosts', () => {
    const result = resolve('/blocks/height', 'https://nodes.decentralchain.io');
    expect(result).toBe('https://nodes.decentralchain.io/blocks/height');
  });

  it('handles paths without leading slash', () => {
    const result = resolve('activation/status', 'https://nodes.example.com');
    expect(result).toBe('https://nodes.example.com/activation/status');
  });
});
