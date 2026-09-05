import multer from "multer";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Buffers files in memory so the storage decision happens in one place
// (storageService): object storage when configured, local disk otherwise.
const storage = multer.memoryStorage();

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new Error("Only JPG, PNG, and WEBP images are supported"));
      return;
    }
    cb(null, true);
  },
});

export const UPLOAD_DIR_PATH = UPLOAD_DIR;