import { ReminderRow } from "./ReminderRow";

type UpcomingReminder = {
  id: string;
  description: string;
  dueAt: Date;
  done: boolean;
  application: { id: string; jobTitle: string; company: { name: string } };
};

export function UpcomingReminders({ reminders }: { reminders: UpcomingReminder[] }) {
  if (reminders.length === 0) return null;

  return (
    <section className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Upcoming</h2>
      <ul className="flex flex-col gap-2">
        {reminders.map((reminder) => (
          <ReminderRow
            key={reminder.id}
            reminder={reminder}
            applicationLink={{
              href: `/applications/${reminder.application.id}`,
              label: `${reminder.application.jobTitle} · ${reminder.application.company.name}`,
            }}
          />
        ))}
      </ul>
    </section>
  );
}
