import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";

/** Next few undone reminders across all of this user's applications, earliest (and any overdue) first — for the board's "Upcoming" widget. */
export async function getUpcomingReminders(limit = 5) {
  const { id: userId } = await requireUser();
  return prisma.reminder.findMany({
    where: { done: false, application: { userId } },
    orderBy: { dueAt: "asc" },
    take: limit,
    include: { application: { select: { id: true, jobTitle: true, company: { select: { name: true } } } } },
  });
}
