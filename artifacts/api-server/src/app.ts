import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import path from "node:path";
import fs from "node:fs";
import router from "./routes";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";

const app: Express = express();

app.set("trust proxy", 1);

const PgSession = connectPgSimple(session);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "billing-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production" || process.env.COOKIE_SECURE === "true",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

app.use("/api", router);

// Serve static frontend assets in production (compatible with Express 5)
const staticPath = path.resolve(process.cwd(), "artifacts/billing-app/dist/public");
if (fs.existsSync(staticPath)) {
  app.use(express.static(staticPath));
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(staticPath, "index.html"));
  });
}

// Global Error Handler for DB Connection Failures & Server Exceptions
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "Unhandled server error");
  if (res.headersSent) return;

  const isDbError =
    err?.code === "ECONNREFUSED" ||
    err?.code === "ENOTFOUND" ||
    err?.message?.includes("Failed query") ||
    err?.message?.includes("connect");

  if (isDbError) {
    res.status(500).json({
      error: "Database connection failed. Please ensure your PostgreSQL/Supabase DATABASE_URL in .env is configured and 'npm run migrate' has been executed.",
    });
    return;
  }

  res.status(500).json({ error: err?.message || "Internal server error" });
});

export default app;
