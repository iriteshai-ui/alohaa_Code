import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

import fs from "node:fs";
import path from "node:path";

if (!process.env.DATABASE_URL) {
  const envPaths = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../../.env"),
    path.resolve(process.cwd(), "../.env"),
  ];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      try {
        process.loadEnvFile(envPath);
        if (process.env.DATABASE_URL) break;
      } catch (e) {}
    }
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const isSupabase =
  process.env.DATABASE_URL.includes("supabase.co") ||
  process.env.DATABASE_URL.includes("supabase.com");

const useSSL =
  process.env.DB_SSL === "true" ||
  (process.env.DB_SSL !== "false" && (isSupabase || (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL.includes("localhost") && !process.env.DATABASE_URL.includes("127.0.0.1"))));

const rejectUnauthorized =
  process.env.DB_SSL_REJECT_UNAUTHORIZED === "true"
    ? true
    : process.env.DB_SSL_REJECT_UNAUTHORIZED === "false"
      ? false
      : !isSupabase; // Supabase pooler connection typically needs rejectUnauthorized: false if ca isn't custom configured

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized } : false,
  max: process.env.DB_MAX_CONNECTIONS ? parseInt(process.env.DB_MAX_CONNECTIONS, 10) : 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
export const db = drizzle(pool, { schema });

export * from "./schema";

