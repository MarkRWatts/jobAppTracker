"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { AttachmentCategory } from "@/generated/prisma/enums";
import { saveAttachmentFile, deleteAttachmentFile, MAX_ATTACHMENT_BYTES } from "./storage";

function parseCategory(formData: FormData): AttachmentCategory {
  const value = formData.get("category");
  if (typeof value === "string" && value in AttachmentCategory) return value as AttachmentCategory;
  throw new Error("Category is required");
}

export async function uploadAttachment(applicationId: string, formData: FormData): Promise<void> {
  const { id: userId } = await requireUser();
  const application = await prisma.application.findFirst({
    where: { id: applicationId, userId },
    select: { id: true },
  });
  if (!application) throw new Error("Application not found");

  const category = parseCategory(formData);
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose a file to upload");
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error(`File is too large (max ${Math.floor(MAX_ATTACHMENT_BYTES / (1024 * 1024))}MB)`);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const storedName = await saveAttachmentFile(userId, file.name, bytes);

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
  const { id: userId } = await requireUser();
  const existing = await prisma.attachment.findFirst({ where: { id, application: { userId } } });
  if (!existing) throw new Error("Attachment not found");
  const result = await prisma.attachment.deleteMany({ where: { id, application: { userId } } });
  if (result.count === 0) throw new Error("Attachment not found");
  await deleteAttachmentFile(userId, existing.storedName);
  revalidatePath(`/applications/${existing.applicationId}`);
}
