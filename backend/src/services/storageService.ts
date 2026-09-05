// Image persistence abstraction. Images are stored as BYTEA blobs inside the
// Postgres database (StoredImage table) and served at /api/images/<id>. Free
// hosting tiers (Render, Neon, Supabase) wipe or recycle the local filesystem
// on every restart but keep the database, so DB-backed storage means uploaded
// photos survive redeploys and idle spin-down with no external object-storage
// account or credit card required. No local disk is used except as a legacy
// read fallback.
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { prisma } from "../db/prisma";
import { UPLOAD_DIR_PATH } from "../middleware/upload";

export const IMAGE_URL_PREFIX = "/api/images";

function mimeFromName(name: string): string {
  const ext = path.extname(name).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

export function getImageUrl(filename: string): string {
  return `${IMAGE_URL_PREFIX}/${filename}`;
}

// Persists a multer buffer under a fresh UUID key and returns the URL to store
// on the record.
export async function storeUploadedFile(file: Express.Multer.File): Promise<string> {
  const ext = path.extname(file.originalname) || ".jpg";
  const filename = `${randomUUID()}${ext}`;
  const buffer = Buffer.isBuffer(file.buffer) ? file.buffer : Buffer.from(file.buffer);
  await saveBuffer(filename, buffer);
  return getImageUrl(filename);
}

// Stores raw bytes under a given key (used by uploads and the seed script).
export async function saveBuffer(filename: string, data: Buffer | string): Promise<string> {
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
  await prisma.storedImage.upsert({
    where: { id: filename },
    create: { id: filename, data: buffer, mimeType: mimeFromName(filename) },
    update: { data: buffer, mimeType: mimeFromName(filename) },
  });
  return getImageUrl(filename);
}

// Reads an image as a Buffer from any of the sources the app supports:
// DB-backed keys (/api/images/<id>), absolute http(s) URLs, or local disk
// files (legacy /uploads/... paths). Used by the AI services before Gemini.
export async function readImageBuffer(imageUrlOrPath: string): Promise<Buffer> {
  const dbMatch = imageUrlOrPath.match(/^\/api\/images\/(.+)$/);
  if (dbMatch) {
    const row = await prisma.storedImage.findUnique({ where: { id: dbMatch[1] } });
    if (!row) throw new Error(`Stored image not found: ${imageUrlOrPath}`);
    return row.data;
  }
  if (/^https?:\/\//i.test(imageUrlOrPath)) {
    const res = await fetch(imageUrlOrPath);
    if (!res.ok) {
      throw new Error(`Failed to fetch image (${res.status}): ${imageUrlOrPath}`);
    }
    return Buffer.from(await res.arrayBuffer());
  }
  const cleaned = imageUrlOrPath.replace(/^\/uploads\//, "");
  return fs.readFileSync(path.isAbsolute(cleaned) ? cleaned : path.join(UPLOAD_DIR_PATH, cleaned));
}