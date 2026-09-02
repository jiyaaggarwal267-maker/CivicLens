import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/apiError";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Not found" });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message });
  }

  console.error("[CivicLens API] Unexpected error:", err);
  return res.status(500).json({ error: "Something went wrong. Please try again." });
}
