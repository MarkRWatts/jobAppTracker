import Link from "next/link";
import { notFound } from "next/navigation";
import { getStatusEvent } from "@/lib/applications/queries";
import { updateStatusEvent } from "@/lib/applications/statusEvents";
import { StatusEventFormFields } from "@/components/StatusEventFormFields";
import { toDateTimeLocalValue } from "@/lib/format";

export default async function EditStatusEventPage({
  params,
}: {
  params: Promise<{ id: string; eventId: string }>;
}) {
  const { id, eventId } = await params;
  const event = await getStatusEvent(eventId);
  if (!event || event.applicationId !== id) notFound();

  const updateStatusEventWithId = updateStatusEvent.bind(null, eventId);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-1">
        <Link
          href={`/applications/${id}`}
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Back
        </Link>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Edit status update</h1>
      </div>
      <form action={updateStatusEventWithId}>
        <StatusEventFormFields
          submitLabel="Save changes"
          defaults={{
            status: event.status,
            stageLabel: event.stageLabel,
            occurredAt: toDateTimeLocalValue(event.occurredAt),
            notes: event.notes,
          }}
        />
      </form>
    </main>
  );
}
