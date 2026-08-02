"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { findOrCreateCompany } from "@/lib/companies/queries";
import { Source, ApplicationStatus, EmploymentType, IR35Status } from "@/generated/prisma/enums";
import { textOrNull, requiredText, parseOccurredAt } from "@/lib/forms";

function parseSource(formData: FormData): Source {
  const value = formData.get("source");
  if (typeof value === "string" && value in Source) return value as Source;
  throw new Error("Source is required");
}

function parseEmploymentType(formData: FormData): EmploymentType {
  const value = formData.get("employmentType");
  if (typeof value === "string" && value in EmploymentType) return value as EmploymentType;
  return EmploymentType.PERMANENT;
}

function parseIr35Status(formData: FormData): IR35Status | null {
  const value = formData.get("ir35Status");
  if (typeof value === "string" && value in IR35Status) return value as IR35Status;
  return null;
}

/** Shared field parsing for both create and update — everything except the initial status/occurredAt, which only create uses. */
async function parseApplicationFields(formData: FormData) {
  return {
    companyId: await findOrCreateCompany(requiredText(formData, "companyName", "Company name")),
    jobTitle: requiredText(formData, "jobTitle", "Job title"),
    source: parseSource(formData),
    jobUrl: textOrNull(formData, "jobUrl"),
    jobDescription: textOrNull(formData, "jobDescription"),
    location: textOrNull(formData, "location"),
    employmentType: parseEmploymentType(formData),
    salaryRange: textOrNull(formData, "salaryRange"),
    dayRate: textOrNull(formData, "dayRate"),
    ir35Status: parseIr35Status(formData),
    usedCustomCv: formData.get("usedCustomCv") === "on",
    cvVersionLabel: textOrNull(formData, "cvVersionLabel"),
    cvUrl: textOrNull(formData, "cvUrl"),
    usedCoverLetter: formData.get("usedCoverLetter") === "on",
    coverLetterUrl: textOrNull(formData, "coverLetterUrl"),
    notes: textOrNull(formData, "notes"),
  };
}

export async function createApplication(formData: FormData): Promise<void> {
  const { id: userId } = await requireUser();
  const fields = await parseApplicationFields(formData);
  const initialStatusRaw = formData.get("initialStatus");
  const initialStatus: ApplicationStatus =
    initialStatusRaw === ApplicationStatus.APPLIED ? ApplicationStatus.APPLIED : ApplicationStatus.SAVED;
  const occurredAt = parseOccurredAt(formData);

  const application = await prisma.application.create({
    data: {
      ...fields,
      userId,
      currentStatus: initialStatus,
      // The only event that exists yet, so it's trivially the application
      // date — see getApplicationDate for the general case.
      boardOrder: occurredAt.getTime(),
      statusEvents: { create: { status: initialStatus, occurredAt } },
    },
  });

  revalidatePath("/");
  redirect(`/applications/${application.id}`);
}

export async function updateApplication(id: string, formData: FormData): Promise<void> {
  const { id: userId } = await requireUser();
  const fields = await parseApplicationFields(formData);

  // Deliberately not touching currentStatus here — status changes go
  // through StatusEvent (see Phase 2), so editing an application never
  // silently rewrites its status history.
  const result = await prisma.application.updateMany({ where: { id, userId }, data: fields });
  if (result.count === 0) throw new Error("Application not found");

  revalidatePath("/");
  revalidatePath(`/applications/${id}`);
  redirect(`/applications/${id}`);
}

export async function deleteApplication(id: string): Promise<void> {
  const { id: userId } = await requireUser();
  const result = await prisma.application.deleteMany({ where: { id, userId } });
  if (result.count === 0) throw new Error("Application not found");
  revalidatePath("/");
  redirect("/");
}
