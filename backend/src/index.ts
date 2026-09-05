import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import morgan from "morgan";
import { UPLOAD_DIR_PATH } from "./middleware/upload";
import reportsRoutes from "./routes/reports.routes";
import issuesRoutes from "./routes/issues.routes";
import mapRoutes from "./routes/map.routes";
import demoRoutes from "./routes/demo.routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

// Hosts like Render's free tier give the app a fresh, empty disk on every
// restart (redeploy, or even an idle spin-down/wake cycle) — but the database
// lives elsewhere (e.g. Neon) and always persists. So after a restart, the DB
// still references demo photos (e.g. /uploads/pothole-1.png) that no longer
// exist on disk. The source images are committed to git, so restore any
// missing ones on every boot — no manual "reload demo" step required, and
// this runs before the server accepts its first request.
const SEED_ASSETS_DIR = path.join(__dirname, "..", "prisma", "seed-assets");
if (fs.existsSync(SEED_ASSETS_DIR)) {
  for (const file of fs.readdirSync(SEED_ASSETS_DIR)) {
    const dest = path.join(UPLOAD_DIR_PATH, file);
    if (!fs.existsSync(dest)) {
      fs.copyFileSync(path.join(SEED_ASSETS_DIR, file), dest);
    }
  }
}

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? "*" }));
app.use(morgan("dev"));
app.use(express.json());
app.use("/uploads", express.static(UPLOAD_DIR_PATH));

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "CivicLens API" }));

app.use("/api/reports", reportsRoutes);
app.use("/api/issues", issuesRoutes);
app.use("/api/map", mapRoutes);
app.use("/api/demo", demoRoutes);

app.use("/api", notFoundHandler);

// Single-service deploy: if a built frontend is present (frontend/dist), serve it
// from this same Express app/origin. Local dev doesn't build the frontend here —
// it runs its own Vite server on :5173 and proxies /api — so this block is a no-op
// until `npm run build` has produced frontend/dist.
const FRONTEND_DIST = path.join(__dirname, "..", "..", "frontend", "dist");
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get(/.*/, (_req, res, next) => {
    res.sendFile(path.join(FRONTEND_DIST, "index.html"), (err) => {
      if (err) next(err);
    });
  });
}

app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`CivicLens API listening on http://localhost:${PORT}`);
});

// Graceful shutdown — close open connections before exiting so Render marks
// the deploy/restart as healthy instead of timing out.
function shutdown(signal: string) {
  console.log(`\n${signal} received – shutting down gracefully…`);
  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
  // Force-kill after 10 s if connections hang
  setTimeout(() => {
    console.error("Forced shutdown after timeout.");
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Prevent crashes from unhandled async errors — log and keep running.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

// Keep-alive ping: Render free-tier spins down after ~15 min of inactivity.
// This pings our own health endpoint every 10 min to keep the service awake.
if (process.env.NODE_ENV === "production") {
  const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes
  setInterval(async () => {
    try {
      await fetch(`http://localhost:${PORT}/api/health`);
    } catch {
      // Server might be mid-restart; ignore
    }
  }, PING_INTERVAL);
}
