import { Pool } from "pg";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });
    // Prevent transient pool errors (e.g. Neon admin termination code 57P01)
    // from throwing unhandled exceptions and crashing the process.
    pool.on("error", (err: Error & { code?: string }) => {
      console.error("[db] Pool client error — code:", err.code, "—", err.message);
    });
  }
  return pool;
}
