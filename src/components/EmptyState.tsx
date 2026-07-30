import Link from "next/link";

export function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-700">
      <p className="text-zinc-600 dark:text-zinc-400">
        {hasFilters ? "No applications match these filters." : "No applications yet."}
      </p>
      {hasFilters ? (
        <a href="?" className="text-sm font-medium text-zinc-900 underline dark:text-zinc-100">
          Clear filters
        </a>
      ) : (
        <Link href="/applications/new" className="text-sm font-medium text-zinc-900 underline dark:text-zinc-100">
          Add your first one
        </Link>
      )}
    </div>
  );
}
