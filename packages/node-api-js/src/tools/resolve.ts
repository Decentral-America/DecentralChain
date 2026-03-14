/**
 * Resolve a relative API path against a base URL.
 *
 * Prevents SSRF by ensuring `path` is always treated as a relative path
 * (absolute URLs like `https://evil.com` are rejected).
 */
export default function (path: string, base: string): string {
  // Strip any leading protocol / double-slash so `path` can never override `base`
  const safePath = path.replace(/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//, '').replace(/^\/\//, '');

  // Ensure the path starts with `/` for a clean join
  const normalised = safePath.startsWith('/') ? safePath : `/${safePath}`;

  const resolved = new URL(normalised, base);

  // Only allow HTTPS in production to prevent man-in-the-middle interception.
  // HTTP is permitted for localhost / 127.0.0.1 to support local development.
  const isLocalhost =
    resolved.hostname === 'localhost' ||
    resolved.hostname === '127.0.0.1' ||
    resolved.hostname === '::1';

  if (resolved.protocol !== 'https:' && !isLocalhost) {
    throw new Error(
      `Insecure protocol "${resolved.protocol}" is not allowed. Use HTTPS for all remote connections.`,
    );
  }

  return resolved.toString();
}
