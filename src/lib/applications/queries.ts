import { prisma } from "@/lib/db";

export function listApplications() {
  return prisma.application.findMany({
    include: { company: true },
    orderBy: { createdAt: "desc" },
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
