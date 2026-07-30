import { ApplicationStatus } from "@/generated/prisma/enums";
import { STATUS_LABELS } from "@/lib/format";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";
const fieldWrapClass = "flex flex-col gap-1";

export function StatusEventFormFields({
  defaults,
  submitLabel,
}: {
  defaults?: {
    status?: ApplicationStatus;
    stageLabel?: string | null;
    occurredAt?: string;
    notes?: string | null;
  };
  submitLabel: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className={fieldWrapClass}>
          <label className={labelClass} htmlFor="status">
            Status
          </label>
          <select id="status" name="status" required defaultValue={defaults?.status} className={inputClass}>
            {Object.values(ApplicationStatus).map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <div className={fieldWrapClass}>
          <label className={labelClass} htmlFor="occurredAt">
            Date &amp; time
          </label>
          <input
            id="occurredAt"
            name="occurredAt"
            type="datetime-local"
            required
            defaultValue={defaults?.occurredAt}
            className={inputClass}
          />
        </div>
      </div>
      <div className={fieldWrapClass}>
        <label className={labelClass} htmlFor="stageLabel">
          Stage label
        </label>
        <input
          id="stageLabel"
          name="stageLabel"
          type="text"
          defaultValue={defaults?.stageLabel ?? undefined}
          className={inputClass}
          placeholder="e.g. Stage 2 — Technical (optional, mainly for Interview)"
        />
      </div>
      <div className={fieldWrapClass}>
        <label className={labelClass} htmlFor="eventNotes">
          Notes
        </label>
        <textarea
          id="eventNotes"
          name="notes"
          rows={2}
          defaultValue={defaults?.notes ?? undefined}
          className={inputClass}
          placeholder="Anything worth remembering about this update..."
        />
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
