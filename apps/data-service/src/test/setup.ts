/**
 * setup.ts
 *
 * Vitest global setup — sets environment variables required by loadConfig()
 * so that candles/pairs parse functions (which call loadConfig) do not throw
 * "Missing required environment variable" errors during HTTP-level unit tests.
 *
 * These values are fake and only used in tests; no real database is contacted.
 */

// PostgreSQL vars (required by loadDefaultConfig/checkEnv)
process.env['PGHOST'] = 'localhost';
process.env['PGDATABASE'] = 'test_db';
process.env['PGUSER'] = 'test_user';
process.env['PGPASSWORD'] = 'test_password';

// Data-service-specific vars
process.env['DEFAULT_MATCHER'] = '3MNXvMCn9FxPPjc4oe9oRGUSMDBXoQvUAdr';
process.env['RATE_PAIR_ACCEPTANCE_VOLUME_THRESHOLD'] = '1';
process.env['RATE_THRESHOLD_ASSET_ID'] = 'DCC';
