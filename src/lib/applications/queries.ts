import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { buildOrderBy, buildWhere, type ApplicationFilters, type ApplicationSort } from "./filters";

/** Applications with their company and latest status event — used by the list view, sortable by its column headers. */
export async function listApplications(filters: ApplicationFilters, sort: ApplicationSort) {
  const { id: userId } = await requireUser();
  return prisma.application.findMany({
    where: { ...buildWhere(filters), userId },
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
export async function listApplicationsForBoard(filters: ApplicationFilters) {
  const { id: userId } = await requireUser();
  return prisma.application.findMany({
    where: { ...buildWhere(filters), userId },
    orderBy: { boardOrder: "asc" },
    include: {
      company: true,
      statusEvents: { orderBy: { occurredAt: "asc" } },
    },
  });
}

export async function getStatusEvent(eventId: string) {
  const { id: userId } = await requireUser();
  return prisma.statusEvent.findFirst({ where: { id: eventId, application: { userId } } });
}

export async function getApplication(id: string) {
  const { id: userId } = await requireUser();
  return prisma.application.findFirst({
    where: { id, userId },
    include: {
      company: true,
      statusEvents: { orderBy: { occurredAt: "desc" } },
      contacts: true,
      reminders: { orderBy: { dueAt: "asc" } },
      attachments: { orderBy: { createdAt: "asc" } },
    },
  });
}
