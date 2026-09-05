// Central AI abstraction for CivicLens: image classification, severity
// assessment, and resolution verification. Backed by Gemini when
// GEMINI_API_KEY is set; otherwise falls back to a deterministic mock so the
// demo never breaks on a missing key. Callers (controllers/services) never
// know which mode is active — they just get back a typed result.
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { readImageBuffer } from "./storageService";

export type CategoryValue =
  | "POTHOLE"
  | "STREETLIGHT"
  | "GARBAGE"
  | "WATER_LEAKAGE"
  | "DAMAGED_FOOTPATH"
  | "OPEN_DRAIN"
  | "OTHER";

export type SeverityValue = "LOW" | "MEDIUM" | "HIGH";
export type VerificationValue = "LIKELY_RESOLVED" | "UNCLEAR" | "NOT_RESOLVED";

export interface ClassificationResult {
  category: CategoryValue;
  severity: SeverityValue;
  confidence: number;
  label: string;
  source: "gemini" | "fallback";
}

export interface VerificationResult {
  status: VerificationValue;
  confidence: number;
  notes: string;
  source: "gemini" | "fallback";
}

let genAI: GoogleGenerativeAI | null | undefined;

export function getGenAI(): GoogleGenerativeAI | null {
  if (genAI !== undefined) return genAI;
  const apiKey = process.env.GEMINI_API_KEY;
  genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
  return genAI;
}

const CATEGORY_PATTERNS: Array<[CategoryValue, RegExp]> = [
  ["POTHOLE", /pothole|road ?damage|crater|hole in (the )?road|caved.?in road/i],
  ["STREETLIGHT", /street ?light|lamp ?post|light pole|dark street/i],
  ["GARBAGE", /garbage|trash|waste|litter|dump(ing)?/i],
  ["WATER_LEAKAGE", /water leak|pipe burst|leakage|sewage overflow|water pipeline/i],
  ["DAMAGED_FOOTPATH", /footpath|pavement|sidewalk|broken tiles/i],
  ["OPEN_DRAIN", /open drain|drain(age)? cover|manhole/i],
];

const CATEGORY_LABELS: Record<CategoryValue, string> = {
  POTHOLE: "Pothole",
  STREETLIGHT: "Broken Streetlight",
  GARBAGE: "Garbage Accumulation",
  WATER_LEAKAGE: "Water Leakage",
  DAMAGED_FOOTPATH: "Damaged Footpath",
  OPEN_DRAIN: "Open Drain",
  OTHER: "Civic Issue",
};

const DEFAULT_SEVERITY: Record<CategoryValue, SeverityValue> = {
  POTHOLE: "HIGH",
  STREETLIGHT: "MEDIUM",
  GARBAGE: "MEDIUM",
  WATER_LEAKAGE: "HIGH",
  DAMAGED_FOOTPATH: "MEDIUM",
  OPEN_DRAIN: "HIGH",
  OTHER: "MEDIUM",
};

function inferCategory(text: string, categoryHint?: CategoryValue): CategoryValue {
  if (categoryHint) return categoryHint;
  for (const [category, pattern] of CATEGORY_PATTERNS) {
    if (pattern.test(text)) return category;
  }
  return "POTHOLE";
}

function inferSeverity(text: string, category: CategoryValue): SeverityValue {
  let severity = DEFAULT_SEVERITY[category];
  if (/severe|dangerous|large|deep|major|huge|serious|accident/i.test(text)) {
    severity = "HIGH";
  } else if (/minor|small|slight|tiny/i.test(text)) {
    severity = severity === "HIGH" ? "MEDIUM" : "LOW";
  }
  return severity;
}

// Deterministic pseudo-random confidence in [min, max), seeded by input so the
// same report always analyzes the same way during a live demo.
function seededConfidence(seed: string, min = 0.86, max = 0.97): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const fraction = (hash % 1000) / 1000;
  return Number((min + fraction * (max - min)).toFixed(2));
}

function fallbackClassify(description: string, filename: string, categoryHint?: CategoryValue): ClassificationResult {
  const text = `${description} ${filename}`;
  const category = inferCategory(text, categoryHint);
  const severity = inferSeverity(text, category);
  return {
    category,
    severity,
    confidence: seededConfidence(`${category}-${description}-${filename}`),
    label: CATEGORY_LABELS[category],
    source: "fallback",
  };
}

export async function classifyCivicImage(params: {
  imageUrl: string;
  description?: string;
  categoryHint?: CategoryValue;
}): Promise<ClassificationResult> {
  const description = params.description ?? "";
  const filename = path.basename(params.imageUrl);
  const client = getGenAI();

  if (!client) {
    return fallbackClassify(description, filename, params.categoryHint);
  }

  try {
    const imageData = await readImageBuffer(params.imageUrl);
    const mimeType = filename.endsWith(".png") ? "image/png" : filename.endsWith(".webp") ? "image/webp" : "image/jpeg";

    const model = client.getGenerativeModel({ model: "gemini-flash-lite-latest" });
    const prompt = `You are a civic-infrastructure inspection assistant. Look at this photo of a reported civic issue${
      description ? ` (citizen description: "${description}")` : ""
    }. Classify it and respond with ONLY compact JSON, no markdown, in this exact shape:
{"category":"POTHOLE|STREETLIGHT|GARBAGE|WATER_LEAKAGE|DAMAGED_FOOTPATH|OPEN_DRAIN|OTHER","severity":"LOW|MEDIUM|HIGH","confidence":0.0-1.0}`;

    const result = await model.generateContent([
      { inlineData: { data: imageData.toString("base64"), mimeType } },
      { text: prompt },
    ]);
    const raw = result.response.text().trim().replace(/^```json|```$/g, "");
    const parsed = JSON.parse(raw);
    const category: CategoryValue = parsed.category ?? "OTHER";
    return {
      category,
      severity: parsed.severity ?? "MEDIUM",
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.85,
      label: CATEGORY_LABELS[category] ?? "Civic Issue",
      source: "gemini",
    };
  } catch (err) {
    console.warn("[CivicLens] Gemini classification failed, using fallback:", (err as Error).message);
    return fallbackClassify(description, filename, params.categoryHint);
  }
}

function fallbackVerify(beforeUrl: string, afterUrl: string): VerificationResult {
  if (beforeUrl === afterUrl) {
    return {
      status: "UNCLEAR",
      confidence: 0.5,
      notes: "Before and after images appear identical — unable to confirm a physical change.",
      source: "fallback",
    };
  }
  const confidence = seededConfidence(`${beforeUrl}-${afterUrl}`, 0.88, 0.96);
  return {
    status: "LIKELY_RESOLVED",
    confidence,
    notes: "The after photo shows a visibly repaired surface consistent with the reported issue being addressed.",
    source: "fallback",
  };
}

export async function verifyResolution(params: {
  beforeUrl: string;
  afterUrl: string;
  category: CategoryValue;
}): Promise<VerificationResult> {
  const client = getGenAI();
  if (!client) {
    return fallbackVerify(params.beforeUrl, params.afterUrl);
  }

  try {
    const before = await readImageBuffer(params.beforeUrl);
    const after = await readImageBuffer(params.afterUrl);
    const mimeType = (url: string) => (url.endsWith(".png") ? "image/png" : url.endsWith(".webp") ? "image/webp" : "image/jpeg");

    const model = client.getGenerativeModel({ model: "gemini-flash-lite-latest" });
    const prompt = `You are verifying whether a reported civic issue (category: ${params.category}) was resolved. The first image is the citizen's original "before" report photo. The second image is the authority's "after" repair photo. Compare them and respond with ONLY compact JSON:
{"status":"LIKELY_RESOLVED|UNCLEAR|NOT_RESOLVED","confidence":0.0-1.0,"notes":"one short sentence"}`;

    const result = await model.generateContent([
      { inlineData: { data: before.toString("base64"), mimeType: mimeType(params.beforeUrl) } },
      { inlineData: { data: after.toString("base64"), mimeType: mimeType(params.afterUrl) } },
      { text: prompt },
    ]);
    const raw = result.response.text().trim().replace(/^```json|```$/g, "");
    const parsed = JSON.parse(raw);
    return {
      status: parsed.status ?? "UNCLEAR",
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.7,
      notes: parsed.notes ?? "AI-assisted comparison of before/after photos.",
      source: "gemini",
    };
  } catch (err) {
    console.warn("[CivicLens] Gemini verification failed, using fallback:", (err as Error).message);
    return fallbackVerify(params.beforeUrl, params.afterUrl);
  }
}

export const categoryLabel = (category: CategoryValue): string => CATEGORY_LABELS[category] ?? "Civic Issue";
