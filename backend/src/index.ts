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

app.listen(PORT, () => {
  console.log(`CivicLens API listening on http://localhost:${PORT}`);
});
