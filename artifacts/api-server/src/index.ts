import app from "./app";
import { logger } from "./lib/logger";
import { seedIfEmpty } from "./lib/startup-seed";
import fs from "node:fs";
import path from "node:path";

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception at server startup:", err);
  logger.error({ err }, "Uncaught Exception");
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection at server startup:", reason);
  logger.error({ reason }, "Unhandled Rejection");
});

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
const isNumericPort = /^\d+$/.test(rawPort);

const server = isNumericPort
  ? app.listen(Number(rawPort), "0.0.0.0", () => {
      logger.info({ port: rawPort }, "Server listening on 0.0.0.0");
      seedIfEmpty().catch((err) => {
        logger.warn({ err }, "Startup seed skipped or caught warning");
      });
    })
  : app.listen(rawPort, () => {
      logger.info({ port: rawPort }, "Server listening on socket");
      seedIfEmpty().catch((err) => {
        logger.warn({ err }, "Startup seed skipped or caught warning");
      });
    });

server.on("error", (err) => {
  console.error("HTTP Server Error:", err);
  logger.error({ err }, "Server error");
});
