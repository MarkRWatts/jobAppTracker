import { prisma } from "@/lib/db";
import { buildOrderBy, buildWhere, type ApplicationFilters, type ApplicationSort } from "./filters";

/** Applications with their company and latest status event (used for "days in stage" on the board and the "last update" column in the list). */
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
    },
  });
}
