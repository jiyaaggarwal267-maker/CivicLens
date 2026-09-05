// Object-storage abstraction. When S3-compatible storage is configured
// (OBJECT_STORAGE_ENDPOINT/ACCESS/SECRET/BUCKET + OBJECT_STORAGE_URL as the
// public base URL), images are uploaded there and referenced by absolute URL —
// so they survive Render's ephemeral filesystem (free tier wipes local disk on
// every restart). Without config, it falls back to local disk (backend/uploads,
// served statically at /uploads), which is fine for local dev.
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { UPLOAD_DIR_PATH } from "../middleware/upload";

const PUBLIC_BASE_PATH = "/uploads";

function storageEnabled(): boolean {
  return Boolean(
    process.env.OBJECT_STORAGE_ENDPOINT &&
      process.env.OBJECT_STORAGE_ACCESS_KEY &&
      process.env.OBJECT_STORAGE_SECRET_KEY &&
      process.env.OBJECT_STORAGE_BUCKET
  );
}

let _s3: S3Client | null = null;
function s3Client(): S3Client {
  if (!_s3) {
    _s3 = new S3Client({
      endpoint: process.env.OBJECT_STORAGE_ENDPOINT,
      region: process.env.OBJECT_STORAGE_REGION || "auto",
      credentials: {
        accessKeyId: process.env.OBJECT_STORAGE_ACCESS_KEY!,
        secretAccessKey: process.env.OBJECT_STORAGE_SECRET_KEY!,
      },
    });
  }
  return _s3;
}

function mimeFromName(name: string): string {
  const ext = path.extname(name).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

export function getImageUrl(filename: string): string {
  const objectStorageUrl = process.env.OBJECT_STORAGE_URL;
  if (objectStorageUrl) {
    return `${objectStorageUrl.replace(/\/$/, "")}/${filename}`;
  }
  return `${PUBLIC_BASE_PATH}/${filename}`;
}

async function uploadToStorage(filename: string, body: Buffer, contentType: string): Promise<void> {
  await s3Client().send(
    new PutObjectCommand({
      Bucket: process.env.OBJECT_STORAGE_BUCKET!,
      Key: filename,
      Body: body,
      ContentType: contentType,
    })
  );
}

// Persists an uploaded multer file (from memory, so nothing touches local disk
// until the storage decision is made). Returns the URL to store on the record.
export async function storeUploadedFile(file: Express.Multer.File): Promise<string> {
  const ext = path.extname(file.originalname) || ".jpg";
  const filename = `${randomUUID()}${ext}`;
  const buffer = Buffer.isBuffer(file.buffer) ? file.buffer : Buffer.from(file.buffer);
  if (storageEnabled()) {
    await uploadToStorage(filename, buffer, mimeFromName(file.originalname || filename));
  } else {
    fs.writeFileSync(path.join(UPLOAD_DIR_PATH, filename), buffer);
  }
  return getImageUrl(filename);
}

// Used by the seed script to materialize demo "photos" directly into storage
// without going through a multipart upload.
export async function saveBuffer(filename: string, data: Buffer | string): Promise<string> {
  const finalName = filename.includes(".") ? filename : `${filename}-${randomUUID()}.png`;
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
  if (storageEnabled()) {
    await uploadToStorage(finalName, buffer, mimeFromName(finalName));
  } else {
    fs.writeFileSync(path.join(UPLOAD_DIR_PATH, finalName), buffer);
  }
  return getImageUrl(finalName);
}

// Reads an image as a Buffer whether it lives remotely (absolute http URL,
// e.g. R2) or on local disk (relative path like "pothole-1.png" or
// "/uploads/pothole-1.png"). Used by the AI services before calling Gemini.
export async function readImageBuffer(imageUrlOrPath: string): Promise<Buffer> {
  if (/^https?:\/\//i.test(imageUrlOrPath)) {
    const res = await fetch(imageUrlOrPath);
    if (!res.ok) {
      throw new Error(`Failed to fetch image (${res.status}): ${imageUrlOrPath}`);
    }
    return Buffer.from(await res.arrayBuffer());
  }
  const cleaned = imageUrlOrPath.replace(/^\/uploads\//, "");
  const absolutePath = path.isAbsolute(cleaned) ? cleaned : path.join(UPLOAD_DIR_PATH, cleaned);
  return fs.readFileSync(absolutePath);
}