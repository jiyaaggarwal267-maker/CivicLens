// Object-storage abstraction. Today it resolves to local disk (backend/uploads,
// served statically at /uploads), which is sufficient for the demo. Swapping in
// a real provider (S3, GCS, etc.) only requires changing `resolveUrl` /
// `saveBuffer` below — callers never touch the filesystem directly.
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { UPLOAD_DIR_PATH } from "../middleware/upload";

const PUBLIC_BASE_PATH = "/uploads";

export function getImageUrl(filename: string): string {
  const objectStorageUrl = process.env.OBJECT_STORAGE_URL;
  if (objectStorageUrl) {
    return `${objectStorageUrl.replace(/\/$/, "")}/${filename}`;
  }
  return `${PUBLIC_BASE_PATH}/${filename}`;
}

export function uploadedFileToUrl(file: Express.Multer.File): string {
  return getImageUrl(file.filename);
}

// Used by the seed script to materialize demo "photos" directly into storage
// without going through a multipart upload.
export function saveBuffer(filename: string, data: Buffer | string): string {
  const finalName = filename.includes(".") ? filename : `${filename}-${randomUUID()}.png`;
  fs.writeFileSync(path.join(UPLOAD_DIR_PATH, finalName), data);
  return getImageUrl(finalName);
}
