import postgres from 'postgres';
import { logger } from './logger';

// ── Connection ────────────────────────────────────────────────────────────────
// Uses the same PostgreSQL server as the rest of the stack (Newark) but connects
// to a dedicated `dcc_admin` database so blockchain indexing data is never mixed
// with admin operational data.
//
// Bootstrap: `CREATE DATABASE dcc_admin;` is run once in infra/bootstrap.sh.
// The same PGUSER/PGPASSWORD credentials that BPS uses are reused here — they
// already have access to all databases on the server.

function buildConnectionString(): string {
  const host = process.env.PGHOST ?? 'localhost';
  const port = process.env.PGPORT ?? '5432';
  const user = process.env.PGUSER ?? 'dcc';
  const password = process.env.PGPASSWORD ?? '';
  const database = process.env.ADMIN_DASHBOARD_PG_DATABASE ?? 'admin_testnet';
  return `postgres://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

// Module-level singleton — postgres.js manages a connection pool internally.
let _sql: ReturnType<typeof postgres> | null = null;

export function getSql(): ReturnType<typeof postgres> {
  if (!_sql) {
    _sql = postgres(buildConnectionString(), {
      connect_timeout: 10,
      idle_timeout: 30,
      max: 5,
      onnotice: () => {
        /* suppress notices */
      },
    });
  }
  return _sql;
}

// ── Schema migration ──────────────────────────────────────────────────────────
// Idempotent DDL — safe to run on every startup.

export async function migrateSchema(): Promise<void> {
  const sql = getSql();
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS load_test_runs (
        id            UUID        PRIMARY KEY,
        started_at    TIMESTAMPTZ NOT NULL,
        completed_at  TIMESTAMPTZ NOT NULL,
        run_by        TEXT        NOT NULL,
        target_node   TEXT        NOT NULL,
        workers       INTEGER     NOT NULL,
        target_tps    INTEGER     NOT NULL,
        duration_s    INTEGER     NOT NULL,
        chain_id      CHAR(1)     NOT NULL,
        sender_count  INTEGER     NOT NULL DEFAULT 1,
        avg_tps       NUMERIC(10, 2) NOT NULL,
        total_sent    BIGINT      NOT NULL,
        total_confirmed BIGINT    NOT NULL,
        total_errors  BIGINT      NOT NULL,
        p50_ms        NUMERIC(10, 2),
        p95_ms        NUMERIC(10, 2),
        p99_ms        NUMERIC(10, 2),
        git_sha       TEXT
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS load_test_runs_started_at_idx
        ON load_test_runs (started_at DESC)
    `;
    logger.info('DB schema migration complete');
  } catch (err) {
    logger.error({ err }, 'DB schema migration failed — load test history will be unavailable');
  }
}
