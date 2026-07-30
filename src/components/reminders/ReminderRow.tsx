"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toggleReminderDone, deleteReminder } from "@/lib/reminders/actions";
import { formatDate, getDueStatus } from "@/lib/format";

const TONE_STYLES = {
  overdue: "text-rose-600 dark:text-rose-400",
  soon: "text-amber-600 dark:text-amber-400",
  later: "text-zinc-500 dark:text-zinc-400",
};

type ReminderRowData = {
  id: string;
  description: string;
  dueAt: Date;
  done: boolean;
};

export function ReminderRow({
  reminder,
  applicationLink,
}: {
  reminder: ReminderRowData;
  applicationLink?: { href: string; label: string };
}) {
  const [isPending, startTransition] = useTransition();
  const dueStatus = getDueStatus(reminder.dueAt);

  return (
    <li className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <input
        type="checkbox"
        checked={reminder.done}
        disabled={isPending}
        onChange={() => {
          startTransition(() => {
            toggleReminderDone(reminder.id);
          });
        }}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 dark:border-zinc-700"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={`text-sm ${
            reminder.done ? "text-zinc-400 line-through dark:text-zinc-500" : "text-zinc-800 dark:text-zinc-200"
          }`}
        >
          {reminder.description}
        </span>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {applicationLink && (
            <Link
              href={applicationLink.href}
              className="truncate text-zinc-500 hover:underline dark:text-zinc-400"
            >
              {applicationLink.label}
            </Link>
          )}
          {reminder.done ? (
            <span className="text-zinc-400 dark:text-zinc-500">{formatDate(reminder.dueAt)}</span>
          ) : (
            <span className={TONE_STYLES[dueStatus.tone]}>{dueStatus.label}</span>
          )}
        </div>
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (!confirm("Delete this reminder?")) return;
          startTransition(() => {
            deleteReminder(reminder.id);
          });
        }}
        className="shrink-0 text-xs font-medium text-rose-600 hover:underline disabled:opacity-50 dark:text-rose-400"
      >
        Delete
      </button>
    </li>
  );
}
