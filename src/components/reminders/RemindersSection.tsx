import { createReminder } from "@/lib/reminders/actions";
import { ReminderRow } from "./ReminderRow";

const inputClass =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

type ReminderData = {
  id: string;
  description: string;
  dueAt: Date;
  done: boolean;
};

export function RemindersSection({ applicationId, reminders }: { applicationId: string; reminders: ReminderData[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Reminders</h2>
      {reminders.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {reminders.map((reminder) => (
            <ReminderRow key={reminder.id} reminder={reminder} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-400 dark:text-zinc-500">No reminders yet.</p>
      )}
      <form action={createReminder.bind(null, applicationId)} className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400" htmlFor="reminder-description">
            Description
          </label>
          <input
            id="reminder-description"
            name="description"
            type="text"
            required
            className={inputClass}
            placeholder="Chase recruiter"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400" htmlFor="reminder-dueAt">
            Due
          </label>
          <input id="reminder-dueAt" name="dueAt" type="date" required className={inputClass} />
        </div>
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          Add reminder
        </button>
      </form>
    </section>
  );
}
