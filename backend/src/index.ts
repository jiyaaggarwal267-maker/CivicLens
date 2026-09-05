import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import morgan from "morgan";
import { UPLOAD_DIR_PATH } from "./middleware/upload";
import { prisma } from "./db/prisma";
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

// Serves images stored in Postgres (StoredImage). Report/Resolution imageUrl
// fields reference /api/images/<id>.
app.get("/api/images/:id", async (req, res) => {
  try {
    const row = await prisma.storedImage.findUnique({ where: { id: req.params.id } });
    if (!row) {
      res.status(404).json({ error: "Image not found" });
      return;
    }
    res.setHeader("Content-Type", row.mimeType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.send(row.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to load image" });
  }
});

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
  // SPA fallback for real page navigations only. Anything that doesn't accept
  // HTML (e.g. a missing /uploads/... image) gets a proper 404 instead of the
  // index.html page, so broken images fail cleanly instead of rendering as
  // unreadable HTML.
  app.get(/.*/, (req, res, next) => {
    if (!req.accepts("html")) {
      res.status(404).end();
      return;
    }
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

// NOTE: Render's free tier spins the service down after ~15 min of idle time,
// and this loading/wake cycle cannot be removed in code (an in-process timer
// stops when the instance sleeps). Keep the instance awake with an external
// uptime monitor (e.g. UptimeRobot) hitting /api/issues/stats every 5 minutes,
// which also keeps the Neon database from sleeping.
