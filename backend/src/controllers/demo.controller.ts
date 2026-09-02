import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { seedDatabase } from "../services/seedService";

export const resetDemo = asyncHandler(async (_req: Request, res: Response) => {
  const result = await seedDatabase();
  res.json({ message: "Demo scenario loaded.", ...result });
});
