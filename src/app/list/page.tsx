import Link from "next/link";
import { listApplications } from "@/lib/applications/queries";
import {
  parseFilters,
  parseSort,
  filterSearchParams,
  sortSearchParams,
  type SearchParams,
  type SortField,
} from "@/lib/applications/filters";
import { FilterBar } from "@/components/FilterBar";
import { ViewTabs } from "@/components/ViewTabs";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { SOURCE_LABELS, formatDate, cvCoverLetterSummary } from "@/lib/format";

const COLUMNS: { field: SortField; label: string }[] = [
  { field: "jobTitle", label: "Job title" },
  { field: "company", label: "Company" },
  { field: "source", label: "Source" },
  { field: "status", label: "Status" },
  { field: "createdAt", label: "Added" },
];

export default async function ListPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const sort = parseSort(params);
  const applications = await listApplications(filters, sort);
  const query = filterSearchParams(filters).toString();
  const hasFilters = filters.sources.length > 0 || filters.statuses.length > 0 || Boolean(filters.from) || Boolean(filters.to);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Applications</h1>
          <ViewTabs active="list" query={query} />
        </div>
        <Link
          href="/applications/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          New application
        </Link>
      </div>

      <FilterBar basePath="/list" filters={filters} />

      {applications.length === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 shadow-sm dark:border-zinc-800">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                {COLUMNS.map(({ field, label }) => (
                  <th key={field} className="px-4 py-2 font-medium text-zinc-500 dark:text-zinc-400">
                    <Link
                      href={`/list?${sortSearchParams(field, sort, filters).toString()}`}
                      className="inline-flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                      {label}
                      {sort.field === field && <span>{sort.dir === "asc" ? "▲" : "▼"}</span>}
                    </Link>
                  </th>
                ))}
                <th className="px-4 py-2 font-medium text-zinc-500 dark:text-zinc-400">CV / Cover letter</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {applications.map((application) => (
                <tr key={application.id} className="bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-3">
                    <Link href={`/applications/${application.id}`} className="font-medium text-zinc-900 hover:underline dark:text-zinc-50">
                      {application.jobTitle}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{application.company.name}</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{SOURCE_LABELS[application.source]}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={application.currentStatus} />
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{formatDate(application.createdAt)}</td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {cvCoverLetterSummary(application.usedCustomCv, application.usedCoverLetter) ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
