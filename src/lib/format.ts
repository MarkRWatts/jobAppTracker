import type { Source, ApplicationStatus } from "@/generated/prisma/enums";

export const SOURCE_LABELS: Record<Source, string> = {
  LINKEDIN: "LinkedIn",
  TOTAL_JOBS: "Total Jobs",
  REED: "Reed",
  DIRECT: "Direct",
  OTHER: "Other",
};

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  SCREENING: "Screening",
  RECRUITER_CALL: "Recruiter call",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  ACCEPTED: "Accepted",
  DISCOUNTED: "Discounted",
  UNSUCCESSFUL: "Unsuccessful",
  WITHDRAWN: "Withdrawn",
};

// Used for status badges/board columns — grouped roughly by how the
// application is progressing, not literally per status.
export const STATUS_STYLES: Record<ApplicationStatus, string> = {
  SAVED: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  APPLIED: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  SCREENING: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  RECRUITER_CALL: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  INTERVIEW: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  OFFER: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  ACCEPTED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  DISCOUNTED: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  UNSUCCESSFUL: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  WITHDRAWN: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
};

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// For a <input type="datetime-local"> defaultValue, in the local timezone.
export function toDateTimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** "Today", "1d", "5d" etc — used for a card's days-in-current-status. */
export function daysSince(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  return `${days}d`;
}

/** "CV", "Cover letter", "CV · Cover letter", or null if neither was used. */
export function cvCoverLetterSummary(usedCustomCv: boolean, usedCoverLetter: boolean): string | null {
  const parts = [usedCustomCv && "CV", usedCoverLetter && "Cover letter"].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : null;
}
