"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { requiredText } from "@/lib/forms";

function revalidateReminders(applicationId: string) {
  revalidatePath("/");
  revalidatePath(`/applications/${applicationId}`);
}

export async function createReminder(applicationId: string, formData: FormData): Promise<void> {
  const { id: userId } = await requireUser();
  const application = await prisma.application.findFirst({
    where: { id: applicationId, userId },
    select: { id: true },
  });
  if (!application) throw new Error("Application not found");

  const description = requiredText(formData, "description", "Description");
  const dueAtRaw = formData.get("dueAt");
  if (typeof dueAtRaw !== "string" || dueAtRaw === "") throw new Error("Due date is required");
  const dueAt = new Date(`${dueAtRaw}T00:00:00`);
  if (Number.isNaN(dueAt.getTime())) throw new Error("Due date is invalid");

  await prisma.reminder.create({ data: { applicationId, description, dueAt } });
  revalidateReminders(applicationId);
}

export async function toggleReminderDone(id: string): Promise<void> {
  const { id: userId } = await requireUser();
  const existing = await prisma.reminder.findFirst({ where: { id, application: { userId } } });
  if (!existing) throw new Error("Reminder not found");
  const result = await prisma.reminder.updateMany({
    where: { id, application: { userId } },
    data: { done: !existing.done },
  });
  if (result.count === 0) throw new Error("Reminder not found");
  revalidateReminders(existing.applicationId);
}

export async function deleteReminder(id: string): Promise<void> {
  const { id: userId } = await requireUser();
  const existing = await prisma.reminder.findFirst({ where: { id, application: { userId } } });
  if (!existing) throw new Error("Reminder not found");
  const result = await prisma.reminder.deleteMany({ where: { id, application: { userId } } });
  if (result.count === 0) throw new Error("Reminder not found");
  revalidateReminders(existing.applicationId);
}
