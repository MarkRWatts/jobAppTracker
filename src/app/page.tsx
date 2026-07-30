import Link from "next/link";
import { listApplications } from "@/lib/applications/queries";
import { parseFilters, parseSort, filterSearchParams, type SearchParams } from "@/lib/applications/filters";
import { FilterBar } from "@/components/FilterBar";
import { ViewTabs } from "@/components/ViewTabs";
import { EmptyState } from "@/components/EmptyState";
import { Board } from "@/components/Board";

export default async function BoardPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
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
          <ViewTabs active="board" query={query} />
        </div>
        <Link
          href="/applications/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          New application
        </Link>
      </div>

      <FilterBar basePath="/" filters={filters} />

      {applications.length === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : (
        <Board applications={applications} statusFilter={filters.statuses} />
      )}
    </main>
  );
}
