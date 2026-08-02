import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { ApplicationStatus, Source } from "@/generated/prisma/enums";
import { PIPELINE_STATUSES, CLOSED_STATUSES } from "@/lib/board";

// "Reached RECRUITER_CALL or beyond" is computed from status *history*, not
// currentStatus — an application that had a recruiter call and was later
// marked DISCOUNTED should still count as having gotten a response.
const RESPONSE_STATUSES = new Set<ApplicationStatus>([
  ApplicationStatus.RECRUITER_CALL,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.OFFER,
  ApplicationStatus.ACCEPTED,
  ApplicationStatus.UNSUCCESSFUL, // by definition, rejected only after an interview
]);

export type DashboardStats = {
  total: number;
  bySource: { source: Source; count: number }[];
  byStatus: { status: ApplicationStatus; count: number }[];
  reachedCount: number;
  responseRate: number; // 0–1
  avgDaysInStage: { status: ApplicationStatus; avgDays: number; count: number }[];
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const { id: userId } = await requireUser();
  const applications = await prisma.application.findMany({
    where: { userId },
    select: {
      source: true,
      currentStatus: true,
      statusEvents: { select: { status: true, occurredAt: true }, orderBy: { occurredAt: "desc" } },
    },
  });

  const total = applications.length;

  const sourceCounts = new Map<Source, number>();
  for (const source of Object.values(Source)) sourceCounts.set(source, 0);
  const statusCounts = new Map<ApplicationStatus, number>();
  for (const status of Object.values(ApplicationStatus)) statusCounts.set(status, 0);
  const daysByStatus = new Map<ApplicationStatus, number[]>();
  let reachedCount = 0;

  for (const application of applications) {
    sourceCounts.set(application.source, (sourceCounts.get(application.source) ?? 0) + 1);
    statusCounts.set(application.currentStatus, (statusCounts.get(application.currentStatus) ?? 0) + 1);

    if (application.statusEvents.some((event) => RESPONSE_STATUSES.has(event.status))) {
      reachedCount += 1;
    }

    const latestEvent = application.statusEvents[0];
    if (latestEvent) {
      const days = (Date.now() - latestEvent.occurredAt.getTime()) / (1000 * 60 * 60 * 24);
      const list = daysByStatus.get(application.currentStatus) ?? [];
      list.push(days);
      daysByStatus.set(application.currentStatus, list);
    }
  }

  const statusOrder = [...PIPELINE_STATUSES, ...CLOSED_STATUSES];

  return {
    total,
    bySource: [...sourceCounts.entries()]
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count),
    byStatus: statusOrder.map((status) => ({ status, count: statusCounts.get(status) ?? 0 })),
    reachedCount,
    responseRate: total > 0 ? reachedCount / total : 0,
    avgDaysInStage: statusOrder
      .map((status) => {
        const days = daysByStatus.get(status) ?? [];
        return { status, avgDays: days.reduce((a, b) => a + b, 0) / (days.length || 1), count: days.length };
      })
      .filter((entry) => entry.count > 0),
  };
}
