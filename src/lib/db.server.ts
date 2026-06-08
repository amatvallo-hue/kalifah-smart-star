import { Pool } from "pg";

let _pool: Pool | null = null;

export function getPool(): Pool {
  if (_pool) return _pool;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  _pool = new Pool({
    connectionString: url,
    ssl: true,
    max: 2,
    idleTimeoutMillis: 5000,
  });
  return _pool;
}
