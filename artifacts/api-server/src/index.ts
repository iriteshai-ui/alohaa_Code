import app from "./app";
import { logger } from "./lib/logger";
import { seedIfEmpty } from "./lib/startup-seed";
import fs from "node:fs";
import path from "node:path";

if (!process.env["PORT"]) {
  const envPaths = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../../.env"),
    path.resolve(process.cwd(), "../.env"),
  ];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      try {
        process.loadEnvFile(envPath);
        if (process.env["PORT"]) break;
      } catch (e) {}
    }
  }
}

const rawPort = process.env["PORT"] || "8080";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Start HTTP server immediately on 0.0.0.0 so Hostinger health checks pass instantly
const server = app.listen(port, "0.0.0.0", () => {
  logger.info({ port }, "Server listening on 0.0.0.0");

  // Run initial seed in background asynchronously without blocking HTTP server boot
  seedIfEmpty().catch((err) => {
    logger.warn({ err }, "Startup seed skipped or caught warning");
  });
});

server.on("error", (err) => {
  logger.error({ err }, "Server error");
});
