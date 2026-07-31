import { prisma } from "@/lib/db";
import { buildOrderBy, buildWhere, type ApplicationFilters, type ApplicationSort } from "./filters";

/** Applications with their company and latest status event — used by the list view, sortable by its column headers. */
export function listApplications(filters: ApplicationFilters, sort: ApplicationSort) {
  return prisma.application.findMany({
    where: buildWhere(filters),
    orderBy: buildOrderBy(sort),
    include: {
      company: true,
      statusEvents: { orderBy: { occurredAt: "desc" }, take: 1 },
    },
  });
}

/**
 * Applications for the board — ordered by boardOrder (the board's own
 * manual/date-derived ordering, not the list view's sortable columns), with
 * full status-event history so each card can derive its application date.
 */
export function listApplicationsForBoard(filters: ApplicationFilters) {
  return prisma.application.findMany({
    where: buildWhere(filters),
    orderBy: { boardOrder: "asc" },
    include: {
      company: true,
      statusEvents: { orderBy: { occurredAt: "asc" } },
    },
  });
}

export function getStatusEvent(eventId: string) {
  return prisma.statusEvent.findUnique({ where: { id: eventId } });
}

export function getApplication(id: string) {
  return prisma.application.findUnique({
    where: { id },
    include: {
      company: true,
      statusEvents: { orderBy: { occurredAt: "desc" } },
      contacts: true,
      reminders: { orderBy: { dueAt: "asc" } },
      attachments: { orderBy: { createdAt: "asc" } },
    },
  });
}
