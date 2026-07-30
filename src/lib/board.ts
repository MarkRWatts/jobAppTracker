import { ApplicationStatus } from "@/generated/prisma/enums";

// Board column order. Discounted/Unsuccessful/Withdrawn collapse into one
// "Closed" column by default (expandable) so the board doesn't sprawl —
// Accepted stays its own column since it's a positive outcome worth seeing
// prominently, not something to tuck away.
export const PIPELINE_STATUSES: ApplicationStatus[] = [
  ApplicationStatus.SAVED,
  ApplicationStatus.APPLIED,
  ApplicationStatus.SCREENING,
  ApplicationStatus.RECRUITER_CALL,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.OFFER,
  ApplicationStatus.ACCEPTED,
];

export const CLOSED_STATUSES: ApplicationStatus[] = [
  ApplicationStatus.DISCOUNTED,
  ApplicationStatus.UNSUCCESSFUL,
  ApplicationStatus.WITHDRAWN,
];

export const CLOSED_COLUMN_ID = "CLOSED";
