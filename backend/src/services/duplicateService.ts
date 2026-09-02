// Duplicate-report consolidation. A new report is folded into an existing
// CivicIssue when it is geographically close (PostGIS ST_DWithin, via
// geoService), of the same category, and semantically similar in description
// (embedding cosine similarity). Geo + category is the primary, reliable
// signal; text similarity is layered on top and reported back for
// transparency rather than used as a hard gate — two one-line "pothole"
// reports at the same spot should still consolidate even if their wording
// barely overlaps.
import { prisma } from "../db/prisma";
import { findIssuesWithinRadius } from "./geoService";
import { cosineSimilarity } from "./embeddingService";

const DUPLICATE_RADIUS_METERS = 250;

export interface DuplicateMatch {
  issueId: string;
  distanceMeters: number;
  textSimilarity: number;
}

export async function findDuplicateIssue(params: {
  latitude: number;
  longitude: number;
  category: string;
  embedding: number[];
}): Promise<DuplicateMatch | null> {
  const nearby = await findIssuesWithinRadius(
    params.latitude,
    params.longitude,
    DUPLICATE_RADIUS_METERS,
    params.category
  );

  if (nearby.length === 0) return null;

  const closest = nearby[0];
  const latestReport = await prisma.report.findFirst({
    where: { issueId: closest.id },
    orderBy: { createdAt: "desc" },
  });

  const textSimilarity = latestReport ? cosineSimilarity(params.embedding, latestReport.embedding) : 0;

  return {
    issueId: closest.id,
    distanceMeters: closest.distanceMeters,
    textSimilarity: Number(textSimilarity.toFixed(2)),
  };
}
