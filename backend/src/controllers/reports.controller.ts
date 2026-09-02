import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import { uploadedFileToUrl } from "../services/storageService";
import { ingestReport } from "../services/reportIngestService";
import { prisma } from "../db/prisma";

const reportSchema = z.object({
  description: z.string().max(2000).optional(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  locationName: z.string().min(1).max(200),
  reporterName: z.string().max(120).optional(),
  userId: z.string().optional(),
});

export const createReport = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ApiError(400, "An image of the issue is required.");
  }

  const parsed = reportSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues.map((i) => i.message).join(", "));
  }

  const imageUrl = uploadedFileToUrl(req.file);
  const result = await ingestReport({
    imageUrl,
    imagePath: req.file.path,
    description: parsed.data.description,
    latitude: parsed.data.latitude,
    longitude: parsed.data.longitude,
    locationName: parsed.data.locationName,
    reporterName: parsed.data.reporterName,
    userId: parsed.data.userId,
  });

  res.status(201).json({
    report: result.report,
    issue: result.issue,
    isDuplicate: result.isDuplicate,
    reportCount: result.reportCount,
    duplicateMatch: result.duplicateMatch,
    classification: result.classification,
  });
});

// Backs the citizen "My Reports" dashboard. Reports aren't tied to a real
// authenticated user (see reporterName on Report), so lookups match on the
// display name captured at submission time.
export const listMyReports = asyncHandler(async (req: Request, res: Response) => {
  const reporterName = typeof req.query.reporterName === "string" ? req.query.reporterName.trim() : "";
  if (!reporterName) {
    throw new ApiError(400, "reporterName is required.");
  }

  const reports = await prisma.report.findMany({
    where: { reporterName: { equals: reporterName, mode: "insensitive" } },
    include: { issue: true },
    orderBy: { createdAt: "desc" },
  });

  res.json({ reports });
});
