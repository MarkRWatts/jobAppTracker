import Link from "next/link";
import { notFound } from "next/navigation";
import { getApplication } from "@/lib/applications/queries";
import { logStatusEvent } from "@/lib/applications/statusEvents";
import { StatusBadge } from "@/components/StatusBadge";
import { DeleteApplicationButton } from "@/components/DeleteApplicationButton";
import { DeleteStatusEventButton } from "@/components/DeleteStatusEventButton";
import { StatusEventFormFields } from "@/components/StatusEventFormFields";
import { SOURCE_LABELS, STATUS_LABELS, formatDateTime, toDateTimeLocalValue } from "@/lib/format";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const application = await getApplication(id);
  if (!application) notFound();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-1">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">
          ← Applications
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{application.jobTitle}</h1>
            <p className="text-zinc-500 dark:text-zinc-400">
              {application.company.name} · {SOURCE_LABELS[application.source]}
            </p>
          </div>
          <StatusBadge status={application.currentStatus} />
        </div>
      </div>

      <div className="flex gap-2">
        <Link
          href={`/applications/${application.id}/edit`}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Edit
        </Link>
        <DeleteApplicationButton id={application.id} jobTitle={application.jobTitle} />
      </div>

      <section className="grid grid-cols-1 gap-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-900">
        <Detail label="Location" value={application.location} />
        <Detail label="Salary range" value={application.salaryRange} />
        <Detail
          label="Job URL"
          value={
            application.jobUrl ? (
              <a href={application.jobUrl} target="_blank" rel="noopener noreferrer" className="truncate text-blue-600 underline dark:text-blue-400">
                {application.jobUrl}
              </a>
            ) : null
          }
        />
        <Detail
          label="Custom CV"
          value={application.usedCustomCv ? application.cvVersionLabel ?? "Yes" : "No"}
        />
        <Detail label="Cover letter" value={application.usedCoverLetter ? "Yes" : "No"} />
      </section>

      {application.jobDescription && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Job description
          </h2>
          <p className="whitespace-pre-wrap rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            {application.jobDescription}
          </p>
        </section>
      )}

      {application.notes && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Notes</h2>
          <p className="whitespace-pre-wrap rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            {application.notes}
          </p>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Timeline</h2>
        <ul className="flex flex-col gap-2">
          {application.statusEvents.map((event) => (
            <li
              key={event.id}
              className="flex flex-col gap-1 rounded-lg border border-zinc-200 bg-white px-4 py-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  {STATUS_LABELS[event.status]}
                  {event.stageLabel ? ` — ${event.stageLabel}` : ""}
                </span>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm text-zinc-400 dark:text-zinc-500">{formatDateTime(event.occurredAt)}</span>
                  <Link
                    href={`/applications/${application.id}/events/${event.id}/edit`}
                    className="text-xs font-medium text-zinc-500 hover:underline dark:text-zinc-400"
                  >
                    Edit
                  </Link>
                  <DeleteStatusEventButton id={event.id} />
                </div>
              </div>
              {event.notes && <p className="text-sm text-zinc-500 dark:text-zinc-400">{event.notes}</p>}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Log an update
        </h2>
        <form action={logStatusEvent.bind(null, application.id)}>
          <StatusEventFormFields submitLabel="Log update" defaults={{ occurredAt: toDateTimeLocalValue(new Date()) }} />
        </form>
      </section>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">{label}</span>
      <span className="truncate text-sm text-zinc-800 dark:text-zinc-200">{value ?? "—"}</span>
    </div>
  );
}
