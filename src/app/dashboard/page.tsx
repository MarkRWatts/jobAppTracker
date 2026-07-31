import Link from "next/link";
import { getDashboardStats } from "@/lib/dashboard/queries";
import { ViewTabs } from "@/components/ViewTabs";
import { StatTile } from "@/components/dashboard/StatTile";
import { Meter } from "@/components/dashboard/Meter";
import { BarChart } from "@/components/dashboard/BarChart";
import { SOURCE_LABELS, STATUS_LABELS } from "@/lib/format";
import { ApplicationStatus } from "@/generated/prisma/enums";
import { PIPELINE_STATUSES, CLOSED_STATUSES } from "@/lib/board";

const ACTIVE_STATUSES = new Set<ApplicationStatus>(PIPELINE_STATUSES.filter((s) => s !== ApplicationStatus.ACCEPTED));
const CLOSED_STATUS_SET = new Set<ApplicationStatus>([...CLOSED_STATUSES, ApplicationStatus.ACCEPTED]);

// Needs a live DB connection for stats — never statically prerender (there's
// no DB reachable at build time).
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const activeCount = stats.byStatus
    .filter((s) => ACTIVE_STATUSES.has(s.status))
    .reduce((sum, s) => sum + s.count, 0);
  const closedCount = stats.byStatus
    .filter((s) => CLOSED_STATUS_SET.has(s.status))
    .reduce((sum, s) => sum + s.count, 0);
  const acceptedCount = stats.byStatus.find((s) => s.status === ApplicationStatus.ACCEPTED)?.count ?? 0;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Applications</h1>
          <ViewTabs active="dashboard" query="" />
        </div>
        <Link
          href="/applications/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          New application
        </Link>
      </div>

      {stats.total === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-700">
          <p className="text-zinc-600 dark:text-zinc-400">No applications yet — stats will show up here once you add some.</p>
          <Link href="/applications/new" className="text-sm font-medium text-zinc-900 underline dark:text-zinc-100">
            Add your first one
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Total applications" value={String(stats.total)} />
            <StatTile label="Active" value={String(activeCount)} hint="Not yet closed" />
            <StatTile label="Closed" value={String(closedCount)} hint={`${acceptedCount} accepted`} />
            <Meter
              label="Reached recruiter call or beyond"
              value={stats.reachedCount}
              total={stats.total}
              hint={`${stats.reachedCount} of ${stats.total} applications`}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <BarChart
              title="Applications by source"
              data={stats.bySource.map((s) => ({ label: SOURCE_LABELS[s.source], value: s.count }))}
            />
            <BarChart
              title="Applications by status"
              data={stats.byStatus.map((s) => ({ label: STATUS_LABELS[s.status], value: s.count }))}
            />
          </div>

          <BarChart
            title="Average time in current stage"
            emptyLabel="No applications currently in a stage with history yet."
            data={stats.avgDaysInStage.map((s) => ({
              label: STATUS_LABELS[s.status],
              value: s.avgDays,
              displayValue: s.avgDays < 1 ? "<1d" : `${Math.round(s.avgDays)}d`,
            }))}
          />
        </>
      )}
    </main>
  );
}
