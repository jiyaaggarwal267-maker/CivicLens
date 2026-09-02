// Deterministic backend priority-scoring function. The frontend never
// computes or hardcodes this number — it always reflects what this function
// returns for the issue's current severity / report count / traffic
// exposure / age.
import { Severity, TrafficExposure } from "@prisma/client";

const SEVERITY_SCORE: Record<Severity, number> = { LOW: 25, MEDIUM: 60, HIGH: 95 };
const TRAFFIC_SCORE: Record<TrafficExposure, number> = { LOW: 25, MEDIUM: 55, HIGH: 90 };

const WEIGHTS = { severity: 0.4, reports: 0.25, traffic: 0.2, age: 0.15 };

export type PriorityLevel = "LOW" | "MEDIUM" | "HIGH";

export interface PriorityInput {
  severity: Severity;
  reportCount: number;
  trafficExposure: TrafficExposure;
  ageInDays: number;
}

export interface PriorityResult {
  priorityScore: number;
  priorityLevel: PriorityLevel;
  breakdown: {
    severityScore: number;
    reportsScore: number;
    trafficScore: number;
    ageScore: number;
  };
}

function reportsScore(reportCount: number): number {
  if (reportCount <= 0) return 0;
  return Math.min(100, 35 + (reportCount - 1) * 25);
}

function ageScore(ageInDays: number): number {
  return Math.min(100, Math.max(0, ageInDays) * 7);
}

export function computePriority(input: PriorityInput): PriorityResult {
  const severityScore = SEVERITY_SCORE[input.severity];
  const reportsSc = reportsScore(input.reportCount);
  const trafficScore = TRAFFIC_SCORE[input.trafficExposure];
  const ageSc = ageScore(input.ageInDays);

  const raw =
    severityScore * WEIGHTS.severity +
    reportsSc * WEIGHTS.reports +
    trafficScore * WEIGHTS.traffic +
    ageSc * WEIGHTS.age;

  const priorityScore = Math.round(Math.min(100, Math.max(0, raw)));
  const priorityLevel: PriorityLevel = priorityScore >= 70 ? "HIGH" : priorityScore >= 40 ? "MEDIUM" : "LOW";

  return {
    priorityScore,
    priorityLevel,
    breakdown: { severityScore, reportsScore: reportsSc, trafficScore, ageScore: ageSc },
  };
}

export function ageInDaysSince(date: Date): number {
  const diffMs = Date.now() - date.getTime();
  return diffMs / (1000 * 60 * 60 * 24);
}

const DEPARTMENT_BY_CATEGORY: Record<string, string> = {
  POTHOLE: "ROAD_MAINTENANCE",
  DAMAGED_FOOTPATH: "ROAD_MAINTENANCE",
  STREETLIGHT: "ELECTRICAL",
  GARBAGE: "SANITATION",
  WATER_LEAKAGE: "WATER_WORKS",
  OPEN_DRAIN: "WATER_WORKS",
  OTHER: "ROAD_MAINTENANCE",
};

export function recommendDepartment(category: string): string {
  return DEPARTMENT_BY_CATEGORY[category] ?? "ROAD_MAINTENANCE";
}

export const DEPARTMENT_LABELS: Record<string, string> = {
  ROAD_MAINTENANCE: "Road Maintenance Department",
  SANITATION: "Sanitation Department",
  ELECTRICAL: "Electrical Department",
  WATER_WORKS: "Water Works Department",
  PARKS_HORTICULTURE: "Parks & Horticulture Department",
};
