// Deterministic demo dataset. Used by `npm run seed` (prisma/seed.ts) and by
// POST /api/demo/reset so a presenter can reliably reload the exact same
// starting state before a live walkthrough.
import fs from "fs";
import path from "path";
import { prisma } from "../db/prisma";
import { saveBuffer } from "./storageService";
import { computePriority } from "./priorityService";
import { Category, IssueStatus, Severity, TrafficExposure } from "@prisma/client";

const ASSETS_DIR = path.join(__dirname, "..", "..", "prisma", "seed-assets");

function seedImage(filename: string): Promise<string> {
  const data = fs.readFileSync(path.join(ASSETS_DIR, filename));
  return saveBuffer(filename, data);
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

interface SeedReportSpec {
  reporterName: string;
  imageFile: string;
  description: string;
  latitude: number;
  longitude: number;
  daysAgo: number;
  category: Category;
  severity: Severity;
  confidence: number;
}

interface SeedIssueSpec {
  code: string;
  title: string;
  category: Category;
  description: string;
  severity: Severity;
  trafficExposure: TrafficExposure;
  status: IssueStatus;
  department: string | null;
  locationName: string;
  latitude: number;
  longitude: number;
  createdDaysAgo: number;
  reports: SeedReportSpec[];
  resolution?: {
    afterImageFile: string;
    verificationStatus: "PENDING" | "LIKELY_RESOLVED" | "UNCLEAR" | "NOT_RESOLVED";
    verificationConfidence: number;
    verificationNotes: string;
    daysAgo: number;
  };
  citizenFeedback?: { resolved: boolean; daysAgo: number };
  events: Array<{ type: string; message: string; daysAgo: number }>;
}

// Dwarka sector coordinates (approximate, real-world plausible).
const SECTOR_10 = { lat: 28.5921, lng: 77.0460 };
const SECTOR_12 = { lat: 28.5707, lng: 77.0424 };
const SECTOR_14 = { lat: 28.5834, lng: 77.0501 };
const SECTOR_21 = { lat: 28.5613, lng: 77.0592 };

function buildScenario(): SeedIssueSpec[] {
  return [
    // ---- CIV-001: the headline demo issue -------------------------------
    {
      code: "CIV-042",
      title: "Pothole — Dwarka Sector 10",
      category: "POTHOLE",
      description: "Large pothole near Dwarka Sector 10 main road, growing after recent rain.",
      severity: "HIGH",
      trafficExposure: "HIGH",
      status: "OPEN",
      department: null,
      locationName: "Dwarka Sector 10, New Delhi",
      latitude: SECTOR_10.lat,
      longitude: SECTOR_10.lng,
      createdDaysAgo: 7,
      reports: [
        {
          reporterName: "Aarav Sharma",
          imageFile: "pothole-1.png",
          description: "Large pothole near Dwarka Sector 10 main road. Cars are swerving to avoid it.",
          latitude: SECTOR_10.lat,
          longitude: SECTOR_10.lng,
          daysAgo: 7,
          category: "POTHOLE",
          severity: "HIGH",
          confidence: 0.94,
        },
        {
          reporterName: "Priya Nair",
          imageFile: "pothole-2.png",
          description: "Same pothole on the main road, it's gotten deeper this week.",
          latitude: SECTOR_10.lat + 0.0006,
          longitude: SECTOR_10.lng + 0.0004,
          daysAgo: 6,
          category: "POTHOLE",
          severity: "HIGH",
          confidence: 0.91,
        },
        {
          reporterName: "Rohan Gupta",
          imageFile: "pothole-3.png",
          description: "Dangerous pothole outside Sector 10 market, almost hit it on my scooter.",
          latitude: SECTOR_10.lat - 0.0005,
          longitude: SECTOR_10.lng + 0.0003,
          daysAgo: 5,
          category: "POTHOLE",
          severity: "HIGH",
          confidence: 0.96,
        },
      ],
      events: [
        { type: "REPORTED", message: "Citizen reported a new issue: Pothole.", daysAgo: 7 },
        { type: "DUPLICATE_MERGED", message: "Another citizen reported a similar issue nearby — consolidated into CIV-042.", daysAgo: 6 },
        { type: "DUPLICATE_MERGED", message: "Another citizen reported a similar issue nearby — consolidated into CIV-042.", daysAgo: 5 },
      ],
    },

    // ---- Broken streetlight, Sector 14 (mid-flow: assigned) -------------
    {
      code: "CIV-036",
      title: "Broken Streetlight — Dwarka Sector 14",
      category: "STREETLIGHT",
      description: "Streetlight has been out for over a week, street is very dark at night.",
      severity: "MEDIUM",
      trafficExposure: "MEDIUM",
      status: "ASSIGNED",
      department: "ELECTRICAL",
      locationName: "Dwarka Sector 14, New Delhi",
      latitude: SECTOR_14.lat,
      longitude: SECTOR_14.lng,
      createdDaysAgo: 5,
      reports: [
        {
          reporterName: "Sanjay Verma",
          imageFile: "streetlight-before.png",
          description: "Streetlight outside the park entrance has been dark for a week.",
          latitude: SECTOR_14.lat,
          longitude: SECTOR_14.lng,
          daysAgo: 5,
          category: "STREETLIGHT",
          severity: "MEDIUM",
          confidence: 0.89,
        },
      ],
      events: [
        { type: "REPORTED", message: "Citizen reported a new issue: Broken Streetlight.", daysAgo: 5 },
        { type: "ASSIGNED", message: "Assigned to Electrical Department.", daysAgo: 3 },
      ],
    },

    // ---- Garbage accumulation, Sector 12 (in progress) -------------------
    {
      code: "CIV-037",
      title: "Garbage Accumulation — Dwarka Sector 12",
      category: "GARBAGE",
      description: "Uncollected garbage piling up near the community park for several days.",
      severity: "MEDIUM",
      trafficExposure: "MEDIUM",
      status: "IN_PROGRESS",
      department: "SANITATION",
      locationName: "Dwarka Sector 12, New Delhi",
      latitude: SECTOR_12.lat,
      longitude: SECTOR_12.lng,
      createdDaysAgo: 9,
      reports: [
        {
          reporterName: "Meera Iyer",
          imageFile: "garbage-before.png",
          description: "Garbage not collected near the park entrance for 4 days now, smells bad.",
          latitude: SECTOR_12.lat,
          longitude: SECTOR_12.lng,
          daysAgo: 9,
          category: "GARBAGE",
          severity: "MEDIUM",
          confidence: 0.88,
        },
        {
          reporterName: "Karan Malhotra",
          imageFile: "garbage-before.png",
          description: "Same pile of garbage still there, growing bigger.",
          latitude: SECTOR_12.lat + 0.0003,
          longitude: SECTOR_12.lng - 0.0002,
          daysAgo: 7,
          category: "GARBAGE",
          severity: "MEDIUM",
          confidence: 0.85,
        },
      ],
      events: [
        { type: "REPORTED", message: "Citizen reported a new issue: Garbage Accumulation.", daysAgo: 9 },
        { type: "DUPLICATE_MERGED", message: "Another citizen reported a similar issue nearby — consolidated into CIV-037.", daysAgo: 7 },
        { type: "ASSIGNED", message: "Assigned to Sanitation Department.", daysAgo: 6 },
        { type: "STATUS_CHANGE", message: "Marked In Progress by the authority.", daysAgo: 4 },
      ],
    },

    // ---- Water leakage, Sector 21 (resolved, verified) --------------------
    {
      code: "CIV-038",
      title: "Water Leakage — Dwarka Sector 21",
      category: "WATER_LEAKAGE",
      description: "Pipeline leak flooding the side of the road near the market.",
      severity: "HIGH",
      trafficExposure: "MEDIUM",
      status: "RESOLVED",
      department: "WATER_WORKS",
      locationName: "Dwarka Sector 21, New Delhi",
      latitude: SECTOR_21.lat,
      longitude: SECTOR_21.lng,
      createdDaysAgo: 14,
      reports: [
        {
          reporterName: "Neha Kapoor",
          imageFile: "water-leak-before.png",
          description: "Water pipeline leaking heavily near the market, wasting a lot of water.",
          latitude: SECTOR_21.lat,
          longitude: SECTOR_21.lng,
          daysAgo: 14,
          category: "WATER_LEAKAGE",
          severity: "HIGH",
          confidence: 0.93,
        },
      ],
      resolution: {
        afterImageFile: "pothole-after.png",
        verificationStatus: "LIKELY_RESOLVED",
        verificationConfidence: 0.93,
        verificationNotes: "The after photo shows the leak has stopped and the road surface is dry.",
        daysAgo: 2,
      },
      citizenFeedback: { resolved: true, daysAgo: 1 },
      events: [
        { type: "REPORTED", message: "Citizen reported a new issue: Water Leakage.", daysAgo: 14 },
        { type: "ASSIGNED", message: "Assigned to Water Works Department.", daysAgo: 12 },
        { type: "STATUS_CHANGE", message: "Marked In Progress by the authority.", daysAgo: 8 },
        { type: "RESOLUTION_UPLOADED", message: "Authority uploaded resolution evidence.", daysAgo: 2 },
        { type: "AI_VERIFICATION", message: "AI-assisted verification: LIKELY RESOLVED (93% confidence).", daysAgo: 2 },
        { type: "STATUS_CHANGE", message: "Marked Resolved by the authority.", daysAgo: 2 },
        { type: "CITIZEN_FEEDBACK", message: "Citizen confirmed the issue was resolved.", daysAgo: 1 },
      ],
    },

    // ---- Damaged footpath, Sector 12 (open, low priority) -----------------
    {
      code: "CIV-039",
      title: "Damaged Footpath — Dwarka Sector 12",
      category: "DAMAGED_FOOTPATH",
      description: "Cracked and uneven footpath tiles near the market.",
      severity: "LOW",
      trafficExposure: "LOW",
      status: "OPEN",
      department: null,
      locationName: "Dwarka Sector 12, New Delhi",
      latitude: SECTOR_12.lat + 0.0015,
      longitude: SECTOR_12.lng - 0.0012,
      createdDaysAgo: 2,
      reports: [
        {
          reporterName: "Ishaan Bose",
          imageFile: "footpath-before.png",
          description: "A few footpath tiles are cracked and uneven near the market entrance.",
          latitude: SECTOR_12.lat + 0.0015,
          longitude: SECTOR_12.lng - 0.0012,
          daysAgo: 2,
          category: "DAMAGED_FOOTPATH",
          severity: "LOW",
          confidence: 0.87,
        },
      ],
      events: [{ type: "REPORTED", message: "Citizen reported a new issue: Damaged Footpath.", daysAgo: 2 }],
    },

    // ---- Open drain, Sector 21 (reopened) ---------------------------------
    {
      code: "CIV-040",
      title: "Open Drain — Dwarka Sector 21",
      category: "OPEN_DRAIN",
      description: "Drain cover missing near the bus stop, safety hazard at night.",
      severity: "HIGH",
      trafficExposure: "HIGH",
      status: "REOPENED",
      department: "WATER_WORKS",
      locationName: "Dwarka Sector 21, New Delhi",
      latitude: SECTOR_21.lat - 0.0018,
      longitude: SECTOR_21.lng + 0.0009,
      createdDaysAgo: 11,
      reports: [
        {
          reporterName: "Divya Rao",
          imageFile: "drain-before.png",
          description: "Open drain cover missing right next to the bus stop, someone could fall in at night.",
          latitude: SECTOR_21.lat - 0.0018,
          longitude: SECTOR_21.lng + 0.0009,
          daysAgo: 11,
          category: "OPEN_DRAIN",
          severity: "HIGH",
          confidence: 0.95,
        },
      ],
      resolution: {
        afterImageFile: "pothole-after.png",
        verificationStatus: "UNCLEAR",
        verificationConfidence: 0.58,
        verificationNotes: "The after photo does not clearly show a replaced cover — needs a second look.",
        daysAgo: 3,
      },
      citizenFeedback: { resolved: false, daysAgo: 2 },
      events: [
        { type: "REPORTED", message: "Citizen reported a new issue: Open Drain.", daysAgo: 11 },
        { type: "ASSIGNED", message: "Assigned to Water Works Department.", daysAgo: 9 },
        { type: "STATUS_CHANGE", message: "Marked In Progress by the authority.", daysAgo: 6 },
        { type: "RESOLUTION_UPLOADED", message: "Authority uploaded resolution evidence.", daysAgo: 3 },
        { type: "AI_VERIFICATION", message: "AI-assisted verification: UNCLEAR (58% confidence).", daysAgo: 3 },
        { type: "STATUS_CHANGE", message: "Marked Resolved by the authority.", daysAgo: 3 },
        { type: "CITIZEN_FEEDBACK", message: "Citizen reported the issue is not actually resolved — reopened.", daysAgo: 2 },
      ],
    },

    // ---- Pothole, Sector 14 (in progress) ----------------------------------
    {
      code: "CIV-041",
      title: "Pothole — Dwarka Sector 14",
      category: "POTHOLE",
      description: "Medium-sized pothole near the metro station exit.",
      severity: "MEDIUM",
      trafficExposure: "HIGH",
      status: "IN_PROGRESS",
      department: "ROAD_MAINTENANCE",
      locationName: "Dwarka Sector 14, New Delhi",
      latitude: SECTOR_14.lat + 0.0022,
      longitude: SECTOR_14.lng - 0.0016,
      createdDaysAgo: 4,
      reports: [
        {
          reporterName: "Farhan Ali",
          imageFile: "pothole-2.png",
          description: "Pothole near the metro station exit, forming after the rains.",
          latitude: SECTOR_14.lat + 0.0022,
          longitude: SECTOR_14.lng - 0.0016,
          daysAgo: 4,
          category: "POTHOLE",
          severity: "MEDIUM",
          confidence: 0.9,
        },
      ],
      events: [
        { type: "REPORTED", message: "Citizen reported a new issue: Pothole.", daysAgo: 4 },
        { type: "ASSIGNED", message: "Assigned to Road Maintenance Department.", daysAgo: 3 },
        { type: "STATUS_CHANGE", message: "Marked In Progress by the authority.", daysAgo: 1 },
      ],
    },
  ];
}

export async function seedDatabase() {
  await prisma.issueEvent.deleteMany();
  await prisma.citizenFeedback.deleteMany();
  await prisma.resolution.deleteMany();
  await prisma.report.deleteMany();
  await prisma.civicIssue.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.createMany({
    data: [
      { name: "Aarav Sharma", email: "aarav@civiclens.demo", role: "CITIZEN" },
      { name: "Priya Nair", email: "priya@civiclens.demo", role: "CITIZEN" },
      { name: "Rohan Gupta", email: "rohan@civiclens.demo", role: "CITIZEN" },
      { name: "Authority Admin", email: "authority@civiclens.demo", role: "AUTHORITY" },
    ],
  });

  const scenario = buildScenario();

  for (const spec of scenario) {
    const issue = await prisma.civicIssue.create({
      data: {
        code: spec.code,
        title: spec.title,
        category: spec.category,
        description: spec.description,
        severity: spec.severity,
        priorityScore: 0,
        priorityLevel: "LOW",
        trafficExposure: spec.trafficExposure,
        status: spec.status,
        department: spec.department as any,
        latitude: spec.latitude,
        longitude: spec.longitude,
        locationName: spec.locationName,
        createdAt: daysAgo(spec.createdDaysAgo),
        updatedAt: daysAgo(0),
      },
    });

    for (const r of spec.reports) {
      await prisma.report.create({
        data: {
          issueId: issue.id,
          reporterName: r.reporterName,
          imageUrl: await seedImage(r.imageFile),
          description: r.description,
          latitude: r.latitude,
          longitude: r.longitude,
          aiCategory: r.category,
          aiSeverity: r.severity,
          aiConfidence: r.confidence,
          embedding: [],
          createdAt: daysAgo(r.daysAgo),
        },
      });
    }

    if (spec.resolution) {
      await prisma.resolution.create({
        data: {
          issueId: issue.id,
          beforeImageUrl: spec.reports[0] ? await seedImage(spec.reports[0].imageFile) : "",
          afterImageUrl: await seedImage(spec.resolution.afterImageFile),
          verificationStatus: spec.resolution.verificationStatus,
          verificationConfidence: spec.resolution.verificationConfidence,
          verificationNotes: spec.resolution.verificationNotes,
          verifiedAt: daysAgo(spec.resolution.daysAgo),
          createdAt: daysAgo(spec.resolution.daysAgo),
        },
      });
    }

    if (spec.citizenFeedback) {
      await prisma.citizenFeedback.create({
        data: {
          issueId: issue.id,
          resolved: spec.citizenFeedback.resolved,
          createdAt: daysAgo(spec.citizenFeedback.daysAgo),
        },
      });
    }

    for (const e of spec.events) {
      await prisma.issueEvent.create({
        data: { issueId: issue.id, type: e.type, message: e.message, createdAt: daysAgo(e.daysAgo) },
      });
    }

    const priority = computePriority({
      severity: issue.severity,
      reportCount: spec.reports.length,
      trafficExposure: issue.trafficExposure,
      ageInDays: spec.createdDaysAgo,
    });

    await prisma.civicIssue.update({
      where: { id: issue.id },
      data: { priorityScore: priority.priorityScore, priorityLevel: priority.priorityLevel },
    });
  }

  const mainIssue = await prisma.civicIssue.findUnique({ where: { code: "CIV-042" } });
  return { issueCount: scenario.length, mainDemoIssueId: mainIssue?.id };
}
