"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { findOrCreateCompany } from "@/lib/companies/queries";
import { Source, ApplicationStatus } from "@/generated/prisma/enums";

function textOrNull(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function requiredText(formData: FormData, key: string, label: string): string {
  const value = textOrNull(formData, key);
  if (!value) throw new Error(`${label} is required`);
  return value;
}

function parseSource(formData: FormData): Source {
  const value = formData.get("source");
  if (typeof value === "string" && value in Source) return value as Source;
  throw new Error("Source is required");
}

function parseOccurredAt(formData: FormData): Date {
  const value = formData.get("occurredAt");
  if (typeof value === "string" && value !== "") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
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
    salaryRange: textOrNull(formData, "salaryRange"),
    usedCustomCv: formData.get("usedCustomCv") === "on",
    cvVersionLabel: textOrNull(formData, "cvVersionLabel"),
    cvUrl: textOrNull(formData, "cvUrl"),
    usedCoverLetter: formData.get("usedCoverLetter") === "on",
    coverLetterUrl: textOrNull(formData, "coverLetterUrl"),
    notes: textOrNull(formData, "notes"),
  };
}

export async function createApplication(formData: FormData): Promise<void> {
  const fields = await parseApplicationFields(formData);
  const initialStatusRaw = formData.get("initialStatus");
  const initialStatus: ApplicationStatus =
    initialStatusRaw === ApplicationStatus.APPLIED ? ApplicationStatus.APPLIED : ApplicationStatus.SAVED;
  const occurredAt = parseOccurredAt(formData);

  const application = await prisma.application.create({
    data: {
      ...fields,
      currentStatus: initialStatus,
      statusEvents: { create: { status: initialStatus, occurredAt } },
    },
  });

  revalidatePath("/");
  redirect(`/applications/${application.id}`);
}

export async function updateApplication(id: string, formData: FormData): Promise<void> {
  const fields = await parseApplicationFields(formData);

  // Deliberately not touching currentStatus here — status changes go
  // through StatusEvent (see Phase 2), so editing an application never
  // silently rewrites its status history.
  await prisma.application.update({ where: { id }, data: fields });

  revalidatePath("/");
  revalidatePath(`/applications/${id}`);
  redirect(`/applications/${id}`);
}

export async function deleteApplication(id: string): Promise<void> {
  await prisma.application.delete({ where: { id } });
  revalidatePath("/");
  redirect("/");
}
