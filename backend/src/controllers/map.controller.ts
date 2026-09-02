import { Request, Response } from "express";
import { prisma } from "../db/prisma";
import { asyncHandler } from "../utils/asyncHandler";

export const getMapIssues = asyncHandler(async (_req: Request, res: Response) => {
  const issues = await prisma.civicIssue.findMany({
    include: { _count: { select: { reports: true } } },
    orderBy: { priorityScore: "desc" },
  });

  res.json({
    issues: issues.map((issue) => ({
      id: issue.id,
      code: issue.code,
      title: issue.title,
      category: issue.category,
      severity: issue.severity,
      status: issue.status,
      priorityScore: issue.priorityScore,
      priorityLevel: issue.priorityLevel,
      latitude: issue.latitude,
      longitude: issue.longitude,
      locationName: issue.locationName,
      reportCount: issue._count.reports,
    })),
  });
});
