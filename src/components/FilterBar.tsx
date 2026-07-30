import { Source, ApplicationStatus } from "@/generated/prisma/enums";
import { SOURCE_LABELS, STATUS_LABELS } from "@/lib/format";
import type { ApplicationFilters } from "@/lib/applications/filters";

const chipClass =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-zinc-300 px-3 py-1 text-sm text-zinc-700 has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-900 has-[:checked]:text-white dark:border-zinc-700 dark:text-zinc-300 dark:has-[:checked]:border-zinc-100 dark:has-[:checked]:bg-zinc-100 dark:has-[:checked]:text-zinc-900";
const dateInputClass =
  "rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

export function FilterBar({ basePath, filters }: { basePath: string; filters: ApplicationFilters }) {
  const hasFilters = filters.sources.length > 0 || filters.statuses.length > 0 || filters.from || filters.to;

  return (
    <form
      method="get"
      action={basePath}
      className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <fieldset className="flex flex-col gap-1.5">
          <legend className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Source
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {Object.values(Source).map((value) => (
              <label key={value} className={chipClass}>
                <input type="checkbox" name="source" value={value} defaultChecked={filters.sources.includes(value)} className="sr-only" />
                {SOURCE_LABELS[value]}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-1.5">
          <legend className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Status
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {Object.values(ApplicationStatus).map((value) => (
              <label key={value} className={chipClass}>
                <input type="checkbox" name="status" value={value} defaultChecked={filters.statuses.includes(value)} className="sr-only" />
                {STATUS_LABELS[value]}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-1.5">
          <legend className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Added between
          </legend>
          <div className="flex items-center gap-2">
            <input type="date" name="from" defaultValue={filters.from ?? undefined} className={dateInputClass} />
            <span className="text-sm text-zinc-400">–</span>
            <input type="date" name="to" defaultValue={filters.to ?? undefined} className={dateInputClass} />
          </div>
        </fieldset>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          Apply filters
        </button>
        {hasFilters && (
          <a href={basePath} className="text-sm text-zinc-500 underline hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">
            Clear
          </a>
        )}
      </div>
    </form>
  );
}
