// Shared pipeline used by both POST /api/reports (open submission, may match
// or create an issue) and POST /api/issues/:id/reports (explicit attach).
// Runs: AI classification -> embedding -> duplicate detection -> consolidate
// or create CivicIssue -> recompute priority -> log timeline events.
import { CategoryValue, classifyCivicImage, categoryLabel } from "./geminiService";
import { generateEmbedding } from "./embeddingService";
import { findDuplicateIssue, DuplicateMatch } from "./duplicateService";
import { computePriority, ageInDaysSince, recommendDepartment } from "./priorityService";
import { nextIssueCode } from "./issueCodeService";
import { prisma } from "../db/prisma";
import { Category, CivicIssue, Report, Severity, TrafficExposure } from "@prisma/client";

const HIGH_TRAFFIC_CATEGORIES = new Set(["POTHOLE", "OPEN_DRAIN", "DAMAGED_FOOTPATH"]);

function severityRank(s: Severity): number {
  return { LOW: 0, MEDIUM: 1, HIGH: 2 }[s];
}

function maxSeverity(a: Severity, b: Severity): Severity {
  return severityRank(a) >= severityRank(b) ? a : b;
}

export interface IngestParams {
  imageUrl: string;
  description?: string;
  latitude: number;
  longitude: number;
  locationName: string;
  reporterName?: string;
  userId?: string;
  forcedIssueId?: string;
  categoryHint?: CategoryValue;
}

export interface IngestResult {
  report: Report;
  issue: CivicIssue;
  isDuplicate: boolean;
  reportCount: number;
  duplicateMatch: DuplicateMatch | null;
  classification: Awaited<ReturnType<typeof classifyCivicImage>>;
}

async function logEvent(issueId: string, type: string, message: string) {
  await prisma.issueEvent.create({ data: { issueId, type, message } });
}

export async function ingestReport(params: IngestParams): Promise<IngestResult> {
  const classification = await classifyCivicImage({
    imageUrl: params.imageUrl,
    description: params.description,
    categoryHint: params.categoryHint,
  });

  const embedding = await generateEmbedding(params.description || classification.label);

  let issue: CivicIssue | null = null;
  let duplicateMatch: DuplicateMatch | null = null;

  if (params.forcedIssueId) {
    issue = await prisma.civicIssue.findUnique({ where: { id: params.forcedIssueId } });
  } else {
    duplicateMatch = await findDuplicateIssue({
      latitude: params.latitude,
      longitude: params.longitude,
      category: classification.category,
      embedding,
    });
    if (duplicateMatch) {
      issue = await prisma.civicIssue.findUnique({ where: { id: duplicateMatch.issueId } });
    }
  }

  const isDuplicate = Boolean(issue);

  if (!issue) {
    const code = await nextIssueCode();
    const trafficExposure: TrafficExposure = HIGH_TRAFFIC_CATEGORIES.has(classification.category)
      ? "HIGH"
      : "MEDIUM";

    issue = await prisma.civicIssue.create({
      data: {
        code,
        title: `${classification.label} — ${params.locationName}`,
        category: classification.category as Category,
        description: params.description,
        severity: classification.severity as Severity,
        priorityScore: 0,
        priorityLevel: "LOW",
        trafficExposure,
        status: "OPEN",
        department: recommendDepartment(classification.category) as CivicIssue["department"],
        latitude: params.latitude,
        longitude: params.longitude,
        locationName: params.locationName,
      },
    });
    await logEvent(issue.id, "REPORTED", `Citizen reported a new issue: ${categoryLabel(classification.category as CategoryValue)}.`);
  }

  const report = await prisma.report.create({
    data: {
      issueId: issue.id,
      userId: params.userId,
      reporterName: params.reporterName ?? "Anonymous Citizen",
      imageUrl: params.imageUrl,
      description: params.description,
      latitude: params.latitude,
      longitude: params.longitude,
      aiCategory: classification.category as Category,
      aiSeverity: classification.severity as Severity,
      aiConfidence: classification.confidence,
      embedding,
    },
  });

  if (isDuplicate) {
    await logEvent(
      issue.id,
      "DUPLICATE_MERGED",
      `Another citizen reported a similar issue nearby — consolidated into ${issue.code}.`
    );
  }

  const reportCount = await prisma.report.count({ where: { issueId: issue.id } });
  const updatedSeverity = maxSeverity(issue.severity, classification.severity as Severity);
  const priority = computePriority({
    severity: updatedSeverity,
    reportCount,
    trafficExposure: issue.trafficExposure,
    ageInDays: ageInDaysSince(issue.createdAt),
  });

  issue = await prisma.civicIssue.update({
    where: { id: issue.id },
    data: {
      severity: updatedSeverity,
      priorityScore: priority.priorityScore,
      priorityLevel: priority.priorityLevel,
    },
  });

  return { report, issue, isDuplicate, reportCount, duplicateMatch, classification };
}
