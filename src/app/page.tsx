import Link from "next/link";
import { listApplications } from "@/lib/applications/queries";
import { StatusBadge } from "@/components/StatusBadge";
import { SOURCE_LABELS, formatDate } from "@/lib/format";

export default async function Home() {
  const applications = await listApplications();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Applications</h1>
        <Link
          href="/applications/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          New application
        </Link>
      </div>

      {applications.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-700">
          <p className="text-zinc-600 dark:text-zinc-400">No applications yet.</p>
          <Link href="/applications/new" className="text-sm font-medium text-zinc-900 underline dark:text-zinc-100">
            Add your first one
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {applications.map((application) => (
            <li key={application.id}>
              <Link
                href={`/applications/${application.id}`}
                className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate font-medium text-zinc-900 dark:text-zinc-50">{application.jobTitle}</span>
                  <span className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                    {application.company.name} · {SOURCE_LABELS[application.source]}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <span className="text-sm text-zinc-400 dark:text-zinc-500">{formatDate(application.createdAt)}</span>
                  <StatusBadge status={application.currentStatus} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
