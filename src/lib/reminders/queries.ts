import { prisma } from "@/lib/db";

/** Next few undone reminders across all applications, earliest (and any overdue) first — for the board's "Upcoming" widget. */
export function getUpcomingReminders(limit = 5) {
  return prisma.reminder.findMany({
    where: { done: false },
    orderBy: { dueAt: "asc" },
    take: limit,
    include: { application: { select: { id: true, jobTitle: true, company: { select: { name: true } } } } },
  });
}
