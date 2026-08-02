import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { buildBaseWhere, buildOrderBy, buildWhere, type ApplicationFilters, type ApplicationSort } from "./filters";
import { getApplicationDate } from "./applicationDate";

/**
 * Applications with their company — used by the list view, sortable by its
 * column headers. Dated by applied date (see getApplicationDate), not
 * createdAt, so the date range filter and "appliedDate" sort are both
 * computed here in JS from the full status-event history rather than at the
 * DB level.
 */
export async function listApplications(filters: ApplicationFilters, sort: ApplicationSort) {
  const { id: userId } = await requireUser();
  const applications = await prisma.application.findMany({
    where: { ...buildBaseWhere(filters), userId },
    orderBy: buildOrderBy(sort),
    include: {
      company: true,
      statusEvents: { orderBy: { occurredAt: "asc" } },
    },
  });

  const dated = applications
    .map((application) => ({ ...application, appliedDate: getApplicationDate(application.statusEvents) }))
    .filter((application) => {
      if (filters.from && application.appliedDate < new Date(`${filters.from}T00:00:00`)) return false;
      if (filters.to && application.appliedDate > new Date(`${filters.to}T23:59:59`)) return false;
      return true;
    });

  if (sort.field === "appliedDate") {
    dated.sort((a, b) =>
      sort.dir === "asc" ? a.appliedDate.getTime() - b.appliedDate.getTime() : b.appliedDate.getTime() - a.appliedDate.getTime(),
    );
  }

  return dated;
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
