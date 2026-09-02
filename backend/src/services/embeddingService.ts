// Lightweight semantic-similarity embedding for report descriptions.
//
// Gemini's text-embedding model is used when GEMINI_API_KEY is configured.
// Otherwise we fall back to a deterministic hashing-trick bag-of-words vector,
// which is a real (if simple) embedding — not a random mock — so cosine
// similarity between two descriptions is still meaningful offline.
import { getGenAI } from "./geminiService";

const DIMENSIONS = 128;

const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "near", "on", "in", "at",
  "of", "to", "and", "there", "this", "that", "it", "its", "very", "big",
  "small", "please", "fix", "report", "reported",
]);

function hashToken(token: string): number {
  let hash = 2166136261;
  for (let i = 0; i < token.length; i++) {
    hash ^= token.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % DIMENSIONS;
}

function localEmbedding(text: string): number[] {
  const vector = new Array(DIMENSIONS).fill(0);
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));

  for (const token of tokens) {
    vector[hashToken(token)] += 1;
  }

  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vector.map((v) => v / magnitude);
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const genAI = getGenAI();
  if (!genAI || !text.trim()) {
    return localEmbedding(text || "");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (err) {
    console.warn("[CivicLens] Gemini embedding failed, using local fallback:", (err as Error).message);
    return localEmbedding(text);
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}
