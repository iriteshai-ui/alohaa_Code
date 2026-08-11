import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./index";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigrations() {
  console.log("Running database migrations on Supabase/PostgreSQL...");
  const migrationsFolder = path.resolve(__dirname, "../drizzle");

  await migrate(db, { migrationsFolder });
  console.log("Database migrations completed successfully.");
  await pool.end();
}

runMigrations().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
