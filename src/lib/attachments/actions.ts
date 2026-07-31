"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { AttachmentCategory } from "@/generated/prisma/enums";
import { saveAttachmentFile, deleteAttachmentFile, MAX_ATTACHMENT_BYTES } from "./storage";

function parseCategory(formData: FormData): AttachmentCategory {
  const value = formData.get("category");
  if (typeof value === "string" && value in AttachmentCategory) return value as AttachmentCategory;
  throw new Error("Category is required");
}

export async function uploadAttachment(applicationId: string, formData: FormData): Promise<void> {
  const category = parseCategory(formData);
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose a file to upload");
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error(`File is too large (max ${Math.floor(MAX_ATTACHMENT_BYTES / (1024 * 1024))}MB)`);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const storedName = await saveAttachmentFile(file.name, bytes);

  await prisma.attachment.create({
    data: {
      applicationId,
      category,
      originalName: file.name,
      storedName,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
    },
  });

  revalidatePath(`/applications/${applicationId}`);
}

export async function deleteAttachment(id: string): Promise<void> {
  const existing = await prisma.attachment.findUniqueOrThrow({ where: { id } });
  await prisma.attachment.delete({ where: { id } });
  await deleteAttachmentFile(existing.storedName);
  revalidatePath(`/applications/${existing.applicationId}`);
}
