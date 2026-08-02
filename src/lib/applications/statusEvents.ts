"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { ApplicationStatus } from "@/generated/prisma/enums";
import { textOrNull, parseOccurredAt } from "@/lib/forms";

function parseStatus(formData: FormData): ApplicationStatus {
  const value = formData.get("status");
  if (typeof value === "string" && value in ApplicationStatus) return value as ApplicationStatus;
  throw new Error("Status is required");
}

/** currentStatus is denormalized as "whichever StatusEvent has the latest occurredAt" — recomputed after every add/edit/delete, since events can be logged out of chronological order (e.g. backfilling a call that happened last week). */
async function recomputeCurrentStatus(applicationId: string, userId: string): Promise<void> {
  const latest = await prisma.statusEvent.findFirst({
    where: { applicationId },
    orderBy: { occurredAt: "desc" },
  });
  if (!latest) {
    // Every application must keep at least one status event — see the
    // guard in deleteStatusEvent. If this ever fires, something else
    // deleted the last event out from under us.
    throw new Error("Application has no status events left");
  }
  const result = await prisma.application.updateMany({
    where: { id: applicationId, userId },
    data: { currentStatus: latest.status },
  });
  if (result.count === 0) throw new Error("Application not found");
}

function revalidateApplication(applicationId: string) {
  revalidatePath("/");
  revalidatePath("/list");
  revalidatePath(`/applications/${applicationId}`);
}

/**
 * Used by the board's drag-and-drop — moves a card to a position within
 * `targetStatus`'s column (immediately before `beforeApplicationId`, or at
 * the end if null/not found), renumbering every card in that column to
 * sequential boardOrder values. If this also crosses a column boundary, logs
 * a plain status change with no stage label/notes, timestamped now.
 */
export async function moveApplication(
  applicationId: string,
  targetStatus: ApplicationStatus,
  beforeApplicationId: string | null,
): Promise<void> {
  const { id: userId } = await requireUser();

  const dragged = await prisma.application.findFirstOrThrow({
    where: { id: applicationId, userId },
    select: { currentStatus: true },
  });

  const siblings = await prisma.application.findMany({
    where: { currentStatus: targetStatus, userId, id: { not: applicationId } },
    orderBy: { boardOrder: "asc" },
    select: { id: true },
  });
  const orderedIds = siblings.map((s) => s.id);
  const insertAt = beforeApplicationId ? orderedIds.indexOf(beforeApplicationId) : -1;
  orderedIds.splice(insertAt === -1 ? orderedIds.length : insertAt, 0, applicationId);

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.application.updateMany({ where: { id, userId }, data: { boardOrder: index } }),
    ),
  );

  if (dragged.currentStatus !== targetStatus) {
    await prisma.statusEvent.create({
      data: { applicationId, status: targetStatus, occurredAt: new Date() },
    });
    await recomputeCurrentStatus(applicationId, userId);
  }

  revalidateApplication(applicationId);
}

export async function logStatusEvent(applicationId: string, formData: FormData): Promise<void> {
  const { id: userId } = await requireUser();
  const application = await prisma.application.findFirst({
    where: { id: applicationId, userId },
    select: { id: true },
  });
  if (!application) throw new Error("Application not found");

  const status = parseStatus(formData);
  const stageLabel = textOrNull(formData, "stageLabel");
  const occurredAt = parseOccurredAt(formData);
  const notes = textOrNull(formData, "notes");

  await prisma.statusEvent.create({
    data: { applicationId, status, stageLabel, occurredAt, notes },
  });
  await recomputeCurrentStatus(applicationId, userId);

  revalidateApplication(applicationId);
}

export async function updateStatusEvent(eventId: string, formData: FormData): Promise<void> {
  const { id: userId } = await requireUser();
  const existing = await prisma.statusEvent.findFirst({
    where: { id: eventId, application: { userId } },
    select: { applicationId: true },
  });
  if (!existing) throw new Error("Status event not found");

  const status = parseStatus(formData);
  const stageLabel = textOrNull(formData, "stageLabel");
  const occurredAt = parseOccurredAt(formData);
  const notes = textOrNull(formData, "notes");

  const result = await prisma.statusEvent.updateMany({
    where: { id: eventId, application: { userId } },
    data: { status, stageLabel, occurredAt, notes },
  });
  if (result.count === 0) throw new Error("Status event not found");
  await recomputeCurrentStatus(existing.applicationId, userId);

  revalidateApplication(existing.applicationId);
  redirect(`/applications/${existing.applicationId}`);
}

export async function deleteStatusEvent(eventId: string): Promise<void> {
  const { id: userId } = await requireUser();
  const existing = await prisma.statusEvent.findFirst({
    where: { id: eventId, application: { userId } },
    select: { applicationId: true },
  });
  if (!existing) throw new Error("Status event not found");

  const remainingCount = await prisma.statusEvent.count({ where: { applicationId: existing.applicationId } });
  if (remainingCount <= 1) {
    throw new Error("Can't delete the only status event on an application");
  }

  const result = await prisma.statusEvent.deleteMany({ where: { id: eventId, application: { userId } } });
  if (result.count === 0) throw new Error("Status event not found");
  await recomputeCurrentStatus(existing.applicationId, userId);

  revalidateApplication(existing.applicationId);
}
