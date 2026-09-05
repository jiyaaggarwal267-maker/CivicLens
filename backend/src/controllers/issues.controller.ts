import { Request, Response } from "express";
import { z } from "zod";
import { Department, IssueStatus } from "@prisma/client";
import { prisma } from "../db/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import { storeUploadedFile } from "../services/storageService";
import { ingestReport } from "../services/reportIngestService";
import { verifyResolution } from "../services/geminiService";
import { computePriority, ageInDaysSince, DEPARTMENT_LABELS } from "../services/priorityService";

async function logEvent(issueId: string, type: string, message: string) {
  await prisma.issueEvent.create({ data: { issueId, type, message } });
}

const issueInclude = {
  reports: { orderBy: { createdAt: "asc" as const } },
  resolutions: { orderBy: { createdAt: "desc" as const } },
  feedbacks: { orderBy: { createdAt: "desc" as const } },
  events: { orderBy: { createdAt: "asc" as const } },
};

function toSummary(issue: any) {
  return {
    id: issue.id,
    code: issue.code,
    title: issue.title,
    category: issue.category,
    severity: issue.severity,
    status: issue.status,
    priorityScore: issue.priorityScore,
    priorityLevel: issue.priorityLevel,
    trafficExposure: issue.trafficExposure,
    department: issue.department,
    latitude: issue.latitude,
    longitude: issue.longitude,
    locationName: issue.locationName,
    reportCount: issue._count?.reports ?? issue.reports?.length ?? 0,
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt,
  };
}

export const listIssues = asyncHandler(async (req: Request, res: Response) => {
  const { status, category, department, sort } = req.query as Record<string, string | undefined>;

  const issues = await prisma.civicIssue.findMany({
    where: {
      status: status ? (status as IssueStatus) : undefined,
      category: category ? (category as any) : undefined,
      department: department ? (department as Department) : undefined,
    },
    include: { _count: { select: { reports: true } } },
    orderBy: sort === "recent" ? { createdAt: "desc" } : { priorityScore: "desc" },
  });

  res.json({ issues: issues.map(toSummary) });
});

export const getIssue = asyncHandler(async (req: Request, res: Response) => {
  const issue = await prisma.civicIssue.findUnique({
    where: { id: req.params.id },
    include: issueInclude,
  });
  if (!issue) throw new ApiError(404, "Issue not found");

  res.json({
    issue: {
      ...toSummary(issue),
      description: issue.description,
      reports: issue.reports,
      resolutions: issue.resolutions,
      feedbacks: issue.feedbacks,
      events: issue.events,
    },
  });
});

const addReportSchema = z.object({
  description: z.string().max(2000).optional(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  locationName: z.string().min(1).max(200),
  reporterName: z.string().max(120).optional(),
});

export const addReportToIssue = asyncHandler(async (req: Request, res: Response) => {
  const issue = await prisma.civicIssue.findUnique({ where: { id: req.params.id } });
  if (!issue) throw new ApiError(404, "Issue not found");
  if (!req.file) throw new ApiError(400, "An image of the issue is required.");

  const parsed = addReportSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues.map((i) => i.message).join(", "));

  const imageUrl = await storeUploadedFile(req.file);
  const result = await ingestReport({
    imageUrl,
    description: parsed.data.description,
    latitude: parsed.data.latitude,
    longitude: parsed.data.longitude,
    locationName: parsed.data.locationName,
    reporterName: parsed.data.reporterName,
    forcedIssueId: issue.id,
  });

  res.status(201).json({ report: result.report, issue: result.issue, reportCount: result.reportCount });
});

const assignSchema = z.object({ department: z.nativeEnum(Department) });

export const assignDepartment = asyncHandler(async (req: Request, res: Response) => {
  const parsed = assignSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, "A valid department is required.");

  const issue = await prisma.civicIssue.findUnique({ where: { id: req.params.id } });
  if (!issue) throw new ApiError(404, "Issue not found");

  const updated = await prisma.civicIssue.update({
    where: { id: issue.id },
    data: { department: parsed.data.department, status: issue.status === "OPEN" ? "ASSIGNED" : issue.status },
  });

  await logEvent(issue.id, "ASSIGNED", `Assigned to ${DEPARTMENT_LABELS[parsed.data.department] ?? parsed.data.department}.`);
  res.json({ issue: updated });
});

const statusSchema = z.object({ status: z.nativeEnum(IssueStatus) });

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, "A valid status is required.");

  const issue = await prisma.civicIssue.findUnique({ where: { id: req.params.id } });
  if (!issue) throw new ApiError(404, "Issue not found");

  const updated = await prisma.civicIssue.update({
    where: { id: issue.id },
    data: { status: parsed.data.status },
  });

  const labels: Record<string, string> = {
    IN_PROGRESS: "Marked In Progress by the authority.",
    RESOLVED: "Marked Resolved by the authority.",
    REOPENED: "Issue reopened.",
    ASSIGNED: "Issue assigned.",
    OPEN: "Issue reopened as Open.",
  };
  await logEvent(issue.id, "STATUS_CHANGE", labels[parsed.data.status] ?? `Status changed to ${parsed.data.status}.`);

  res.json({ issue: updated });
});

const resolutionSchema = z.object({});

export const addResolution = asyncHandler(async (req: Request, res: Response) => {
  const issue = await prisma.civicIssue.findUnique({ where: { id: req.params.id }, include: { reports: { orderBy: { createdAt: "asc" } } } });
  if (!issue) throw new ApiError(404, "Issue not found");
  if (!req.file) throw new ApiError(400, "An 'after' image of the repaired issue is required.");
  if (issue.reports.length === 0) throw new ApiError(400, "This issue has no citizen photo to compare against.");

  const beforeImageUrl = issue.reports[0].imageUrl;
  const afterImageUrl = await storeUploadedFile(req.file);

  const resolution = await prisma.resolution.create({
    data: { issueId: issue.id, beforeImageUrl, afterImageUrl, verificationStatus: "PENDING" },
  });

  await logEvent(issue.id, "RESOLUTION_UPLOADED", "Authority uploaded resolution evidence.");
  res.status(201).json({ resolution });
});

export const runVerification = asyncHandler(async (req: Request, res: Response) => {
  const issue = await prisma.civicIssue.findUnique({ where: { id: req.params.id } });
  if (!issue) throw new ApiError(404, "Issue not found");

  const resolution = await prisma.resolution.findFirst({ where: { issueId: issue.id }, orderBy: { createdAt: "desc" } });
  if (!resolution) throw new ApiError(400, "Upload resolution evidence before running verification.");

  const result = await verifyResolution({
    beforeUrl: resolution.beforeImageUrl,
    afterUrl: resolution.afterImageUrl,
    category: issue.category,
  });

  const updated = await prisma.resolution.update({
    where: { id: resolution.id },
    data: {
      verificationStatus: result.status,
      verificationConfidence: result.confidence,
      verificationNotes: result.notes,
      verifiedAt: new Date(),
    },
  });

  await logEvent(
    issue.id,
    "AI_VERIFICATION",
    `AI-assisted verification: ${result.status.replace(/_/g, " ")} (${Math.round(result.confidence * 100)}% confidence).`
  );

  res.json({ resolution: updated });
});

const feedbackSchema = z.object({ resolved: z.boolean(), userId: z.string().optional() });

export const submitFeedback = asyncHandler(async (req: Request, res: Response) => {
  const parsed = feedbackSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, "resolved (boolean) is required.");

  const issue = await prisma.civicIssue.findUnique({ where: { id: req.params.id } });
  if (!issue) throw new ApiError(404, "Issue not found");

  const feedback = await prisma.citizenFeedback.create({
    data: { issueId: issue.id, resolved: parsed.data.resolved, userId: parsed.data.userId },
  });

  const newStatus: IssueStatus = parsed.data.resolved ? "RESOLVED" : "REOPENED";
  let updated = await prisma.civicIssue.update({ where: { id: issue.id }, data: { status: newStatus } });

  if (!parsed.data.resolved) {
    const reportCount = await prisma.report.count({ where: { issueId: issue.id } });
    const priority = computePriority({
      severity: updated.severity,
      reportCount,
      trafficExposure: updated.trafficExposure,
      ageInDays: ageInDaysSince(updated.createdAt),
    });
    updated = await prisma.civicIssue.update({
      where: { id: issue.id },
      data: { priorityScore: priority.priorityScore, priorityLevel: priority.priorityLevel },
    });
  }

  await logEvent(
    issue.id,
    "CITIZEN_FEEDBACK",
    parsed.data.resolved
      ? "Citizen confirmed the issue was resolved."
      : "Citizen reported the issue is not actually resolved — reopened."
  );

  res.status(201).json({ feedback, issue: updated });
});

export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const [open, highPriority, inProgress, resolved, reopened, total] = await Promise.all([
    prisma.civicIssue.count({ where: { status: { in: ["OPEN", "ASSIGNED"] } } }),
    prisma.civicIssue.count({ where: { priorityLevel: "HIGH", status: { notIn: ["RESOLVED"] } } }),
    prisma.civicIssue.count({ where: { status: "IN_PROGRESS" } }),
    prisma.civicIssue.count({ where: { status: "RESOLVED" } }),
    prisma.civicIssue.count({ where: { status: "REOPENED" } }),
    prisma.civicIssue.count(),
  ]);

  const byCategory = await prisma.civicIssue.groupBy({ by: ["category"], _count: { _all: true } });
  const byStatus = await prisma.civicIssue.groupBy({ by: ["status"], _count: { _all: true } });

  res.json({
    openIssues: open,
    highPriority,
    inProgress,
    resolved,
    reopened,
    total,
    resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
    byCategory: byCategory.map((c) => ({ category: c.category, count: c._count._all })),
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count._all })),
  });
});
