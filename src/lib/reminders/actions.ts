"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requiredText } from "@/lib/forms";

function revalidateReminders(applicationId: string) {
  revalidatePath("/");
  revalidatePath(`/applications/${applicationId}`);
}

export async function createReminder(applicationId: string, formData: FormData): Promise<void> {
  const description = requiredText(formData, "description", "Description");
  const dueAtRaw = formData.get("dueAt");
  if (typeof dueAtRaw !== "string" || dueAtRaw === "") throw new Error("Due date is required");
  const dueAt = new Date(`${dueAtRaw}T00:00:00`);
  if (Number.isNaN(dueAt.getTime())) throw new Error("Due date is invalid");

  await prisma.reminder.create({ data: { applicationId, description, dueAt } });
  revalidateReminders(applicationId);
}

export async function toggleReminderDone(id: string): Promise<void> {
  const existing = await prisma.reminder.findUniqueOrThrow({ where: { id } });
  await prisma.reminder.update({ where: { id }, data: { done: !existing.done } });
  revalidateReminders(existing.applicationId);
}

export async function deleteReminder(id: string): Promise<void> {
  const existing = await prisma.reminder.findUniqueOrThrow({ where: { id } });
  await prisma.reminder.delete({ where: { id } });
  revalidateReminders(existing.applicationId);
}
