import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

// Same path in dev (project root) and in the container (WORKDIR /app) —
// see the `uploads` volume in docker-compose.yml. Created on demand since a
// fresh checkout/volume won't have it yet.
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024; // 20MB — generous for a CV/cover letter/PDF

// userId always comes from the authenticated session (a cuid we minted, never
// user-supplied text), so there's no path-traversal risk in joining it in.
function userDir(userId: string): string {
  return path.join(UPLOADS_DIR, userId);
}

/** A filesystem-safe on-disk name, distinct from the original filename (which may contain anything). */
function generateStoredName(originalName: string): string {
  const ext = path.extname(originalName).replace(/[^a-zA-Z0-9.]/g, "");
  return `${randomUUID()}${ext}`;
}

export async function saveAttachmentFile(userId: string, originalName: string, bytes: Buffer): Promise<string> {
  const dir = userDir(userId);
  await mkdir(dir, { recursive: true });
  const storedName = generateStoredName(originalName);
  await writeFile(path.join(dir, storedName), bytes);
  return storedName;
}

export async function readAttachmentFile(userId: string, storedName: string): Promise<Buffer> {
  return readFile(path.join(userDir(userId), storedName));
}

export async function deleteAttachmentFile(userId: string, storedName: string): Promise<void> {
  await unlink(path.join(userDir(userId), storedName)).catch(() => {
    // Already gone — fine, the DB row is the source of truth for "does this attachment exist".
  });
}
