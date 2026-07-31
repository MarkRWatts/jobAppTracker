import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

// Same path in dev (project root) and in the container (WORKDIR /app) —
// see the `uploads` volume in docker-compose.yml. Created on demand since a
// fresh checkout/volume won't have it yet.
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024; // 20MB — generous for a CV/cover letter/PDF

/** A filesystem-safe on-disk name, distinct from the original filename (which may contain anything). */
function generateStoredName(originalName: string): string {
  const ext = path.extname(originalName).replace(/[^a-zA-Z0-9.]/g, "");
  return `${randomUUID()}${ext}`;
}

export async function saveAttachmentFile(originalName: string, bytes: Buffer): Promise<string> {
  await mkdir(UPLOADS_DIR, { recursive: true });
  const storedName = generateStoredName(originalName);
  await writeFile(path.join(UPLOADS_DIR, storedName), bytes);
  return storedName;
}

export async function readAttachmentFile(storedName: string): Promise<Buffer> {
  return readFile(path.join(UPLOADS_DIR, storedName));
}

export async function deleteAttachmentFile(storedName: string): Promise<void> {
  await unlink(path.join(UPLOADS_DIR, storedName)).catch(() => {
    // Already gone — fine, the DB row is the source of truth for "does this attachment exist".
  });
}
