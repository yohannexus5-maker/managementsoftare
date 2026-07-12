import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export const STORAGE_ROOT = path.join(__dirname, "..", "..", "storage");

export function projectStorageDir(projectId: string, category: string): string {
  const dir = path.join(STORAGE_ROOT, projectId, category.toLowerCase());
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function buildStoredFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext).replace(/[^a-zA-Z0-9-_]/g, "_");
  return `${base}-${crypto.randomBytes(4).toString("hex")}${ext}`;
}

export function absoluteToRelative(absPath: string): string {
  return path.relative(STORAGE_ROOT, absPath);
}

export function relativeToAbsolute(relPath: string): string {
  return path.join(STORAGE_ROOT, relPath);
}
