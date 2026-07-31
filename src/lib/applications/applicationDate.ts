import { ApplicationStatus } from "@/generated/prisma/enums";

type DatedEvent = { status: ApplicationStatus; occurredAt: Date };

/**
 * "Application date" — when this application was actually applied to, not
 * when it was first saved or last touched. Falls back to the earliest event
 * (e.g. a still-SAVED application has no APPLIED event yet) so every
 * application always has a usable date.
 */
export function getApplicationDate(events: DatedEvent[]): Date {
  const applied = events.find((e) => e.status === ApplicationStatus.APPLIED);
  if (applied) return applied.occurredAt;

  const earliest = events.reduce<Date | null>((earliestSoFar, event) => {
    if (!earliestSoFar || event.occurredAt < earliestSoFar) return event.occurredAt;
    return earliestSoFar;
  }, null);
  return earliest ?? new Date();
}
